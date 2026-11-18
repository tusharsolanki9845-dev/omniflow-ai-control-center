import { useState, useEffect } from 'react';
import {
  Connection,
  ModelConfig,
  ToolDefinition,
  Action,
  AuditLog,
  LocalFile,
  LocalDeviceAgentConfig,
  Automation,
  GatewaySettings,
  ChatMessage,
  Conversation,
  ActionPlanStep,
  RiskLevel,
  AIProject,
  NotificationItem,
  NotificationType,
  NotificationPriority,
} from '../types';
import {
  INITIAL_MODELS,
  INITIAL_CONNECTIONS,
  INITIAL_TOOLS,
  INITIAL_ACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_LOCAL_FILES,
  INITIAL_LOCAL_AGENT,
  INITIAL_AUTOMATIONS,
  INITIAL_GATEWAY_SETTINGS,
  INITIAL_CONVERSATION,
  INITIAL_MESSAGES,
  INITIAL_PROJECTS,
  INITIAL_NOTIFICATIONS,
} from '../mock/initialData';
import { notificationSound } from '../utils/notificationSound';
import { authenticatedFetch } from './firebaseAuthService';

const STORAGE_KEY = 'omniflow_state_v1.1';
const DEFAULT_CONNECTIONS: Connection[] = INITIAL_CONNECTIONS.map((connection) => ({
  ...connection,
  status: 'disconnected',
  isEnabled: false,
  lastTestedAt: undefined,
  latencyMs: undefined,
  description: 'Example integration configuration; live authorization is not set up.',
}));

export interface OmniFlowState {
  models: ModelConfig[];
  connections: Connection[];
  tools: ToolDefinition[];
  actions: Action[];
  auditLogs: AuditLog[];
  localFiles: LocalFile[];
  localAgent: LocalDeviceAgentConfig;
  automations: Automation[];
  projects: AIProject[];
  gatewaySettings: GatewaySettings;
  conversations: Conversation[];
  activeConversationId: string;
  messages: ChatMessage[];
  currentPlanSteps: ActionPlanStep[];
  notifications: NotificationItem[];
  notificationSoundEnabled: boolean;
}

function getInitialState(storageKey: string): OmniFlowState {
  if (typeof window === 'undefined') {
    return {
      models: INITIAL_MODELS,
      connections: DEFAULT_CONNECTIONS,
      tools: INITIAL_TOOLS,
      actions: INITIAL_ACTIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
      localFiles: INITIAL_LOCAL_FILES,
      localAgent: INITIAL_LOCAL_AGENT,
      automations: INITIAL_AUTOMATIONS,
      projects: INITIAL_PROJECTS,
      gatewaySettings: INITIAL_GATEWAY_SETTINGS,
      conversations: [INITIAL_CONVERSATION],
      activeConversationId: INITIAL_CONVERSATION.id,
      messages: INITIAL_MESSAGES,
      currentPlanSteps: [],
      notifications: INITIAL_NOTIFICATIONS,
      notificationSoundEnabled: true,
    };
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const existingAuditIds = new Set((parsed.auditLogs || []).map((l: any) => l.id));
      const mergedAuditLogs = [
        ...(parsed.auditLogs || []),
        ...INITIAL_AUDIT_LOGS.filter((l) => !existingAuditIds.has(l.id)),
      ];

      const existingNotifIds = new Set((parsed.notifications || []).map((n: any) => n.id));
      const mergedNotifications = [
        ...(parsed.notifications || []),
        ...INITIAL_NOTIFICATIONS.filter((n) => !existingNotifIds.has(n.id)),
      ];

      return {
        models: INITIAL_MODELS,
        connections: (parsed.connections || DEFAULT_CONNECTIONS).map((connection: Connection) => ({
          ...connection,
          status: 'disconnected',
          isEnabled: false,
          lastTestedAt: undefined,
          latencyMs: undefined,
        })),
        tools: parsed.tools || INITIAL_TOOLS,
        actions: parsed.actions || INITIAL_ACTIONS,
        auditLogs: mergedAuditLogs.length ? mergedAuditLogs : INITIAL_AUDIT_LOGS,
        localFiles: parsed.localFiles || INITIAL_LOCAL_FILES,
        localAgent: {
          ...(parsed.localAgent || INITIAL_LOCAL_AGENT),
          status: 'disconnected',
          tunnelEndpoint: '',
          port: 0,
          sandboxed: false,
          allowedDirectories: [],
          allowlistCommands: [],
          cpuUsagePct: 0,
          memoryUsageMb: 0,
          uptimeSeconds: 0,
        },
        automations: (parsed.automations || INITIAL_AUTOMATIONS).map((automation: Automation) => ({
          ...automation,
          isEnabled: false,
          lastRun: undefined,
          lastStatus: undefined,
          totalRuns: 0,
        })),
        projects: parsed.projects || INITIAL_PROJECTS,
        gatewaySettings: parsed.gatewaySettings || INITIAL_GATEWAY_SETTINGS,
        conversations: parsed.conversations || [INITIAL_CONVERSATION],
        activeConversationId: parsed.activeConversationId || INITIAL_CONVERSATION.id,
        messages: parsed.messages || INITIAL_MESSAGES,
        currentPlanSteps: [],
        notifications: mergedNotifications.length ? mergedNotifications : INITIAL_NOTIFICATIONS,
        notificationSoundEnabled: parsed.notificationSoundEnabled !== undefined ? parsed.notificationSoundEnabled : true,
      };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }

  return {
    models: INITIAL_MODELS,
    connections: DEFAULT_CONNECTIONS,
    tools: INITIAL_TOOLS,
    actions: INITIAL_ACTIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
    localFiles: INITIAL_LOCAL_FILES,
    localAgent: INITIAL_LOCAL_AGENT,
    automations: INITIAL_AUTOMATIONS,
    projects: INITIAL_PROJECTS,
    gatewaySettings: INITIAL_GATEWAY_SETTINGS,
    conversations: [INITIAL_CONVERSATION],
    activeConversationId: INITIAL_CONVERSATION.id,
    messages: INITIAL_MESSAGES,
    currentPlanSteps: [],
    notifications: INITIAL_NOTIFICATIONS,
    notificationSoundEnabled: true,
  };
}

export function useOmniFlowStore(userId: string) {
  const storageKey = `${STORAGE_KEY}_${userId}`;
  const [state, setState] = useState<OmniFlowState>(() => getInitialState(storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [state, storageKey]);

  const approveAction = (actionId: string) => {
    setState((prev) => {
      const action = prev.actions.find((a) => a.id === actionId);
      if (!action) return prev;
      const updatedAction: Action = {
        ...action,
        status: 'approved',
        executedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        approvedBy: 'tushar (Admin Approval)',
        result: { success: true, status: 'COMMITTED', target: action.targetResource, details: 'Dispatched successfully via standardized connector gateway.' },
      };
      const newAuditLog: AuditLog = {
        id: `log-${Date.now().toString(36)}`,
        actionId: action.id,
        event: 'ACTION_APPROVED_AND_EXECUTED',
        modelUsed: prev.gatewaySettings.defaultModelId,
        tool: action.toolName,
        provider: action.provider,
        payloadHash: Math.random().toString(16).substring(2, 14) + '...',
        status: 'SUCCESS',
        riskLevel: action.riskLevel,
        argumentsDigest: JSON.stringify(action.arguments).substring(0, 80) + '...',
        user: 'tushar',
        latencyMs: Math.floor(Math.random() * 80) + 40,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      return { ...prev, actions: prev.actions.map((a) => (a.id === actionId ? updatedAction : a)), auditLogs: [newAuditLog, ...prev.auditLogs] };
    });
  };

  const rejectAction = (actionId: string, feedbackNote?: string) => {
    setState((prev) => {
      const action = prev.actions.find((a) => a.id === actionId);
      if (!action) return prev;
      const updatedAction: Action = { ...action, status: 'rejected', feedbackNote: feedbackNote || 'Rejected by operator in approval queue.' };
      const newAuditLog: AuditLog = {
        id: `log-${Date.now().toString(36)}`,
        actionId: action.id,
        event: 'ACTION_REJECTED_BY_OPERATOR',
        modelUsed: prev.gatewaySettings.defaultModelId,
        tool: action.toolName,
        provider: action.provider,
        payloadHash: Math.random().toString(16).substring(2, 14) + '...',
        status: 'REJECTED',
        riskLevel: action.riskLevel,
        argumentsDigest: feedbackNote ? `Note: ${feedbackNote}` : 'Rejected without modifications',
        user: 'tushar',
        latencyMs: 12,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      return { ...prev, actions: prev.actions.map((a) => (a.id === actionId ? updatedAction : a)), auditLogs: [newAuditLog, ...prev.auditLogs] };
    });
  };

  const batchApproveActions = (actionIds: string[]) => {
    if (!actionIds.length) return;
    setState((prev) => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newAuditLogs: AuditLog[] = [];
      const updatedActions = prev.actions.map((action) => {
        if (actionIds.includes(action.id) && action.status === 'pending_approval') {
          newAuditLogs.push({
            id: `log-${Date.now().toString(36)}-${action.id.slice(-4)}`,
            actionId: action.id,
            event: 'ACTION_BATCH_APPROVED',
            modelUsed: prev.gatewaySettings.defaultModelId,
            tool: action.toolName,
            provider: action.provider,
            payloadHash: Math.random().toString(16).substring(2, 14) + '...',
            status: 'SUCCESS',
            riskLevel: action.riskLevel,
            argumentsDigest: JSON.stringify(action.arguments).substring(0, 80) + '...',
            user: 'tushar',
            latencyMs: Math.floor(Math.random() * 60) + 30,
            timestamp: now,
          });
          return {
            ...action,
            status: 'approved' as const,
            executedAt: now,
            approvedBy: 'tushar (Batch Approval)',
            result: { success: true, status: 'COMMITTED', target: action.targetResource, details: 'Dispatched in atomic batch via standardized connector gateway.' },
          };
        }
        return action;
      });
      return { ...prev, actions: updatedActions, auditLogs: [...newAuditLogs, ...prev.auditLogs] };
    });
  };

  const batchRejectActions = (actionIds: string[], feedbackNote?: string) => {
    if (!actionIds.length) return;
    setState((prev) => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newAuditLogs: AuditLog[] = [];
      const updatedActions = prev.actions.map((action) => {
        if (actionIds.includes(action.id) && action.status === 'pending_approval') {
          newAuditLogs.push({
            id: `log-${Date.now().toString(36)}-${action.id.slice(-4)}`,
            actionId: action.id,
            event: 'ACTION_BATCH_REJECTED',
            modelUsed: prev.gatewaySettings.defaultModelId,
            tool: action.toolName,
            provider: action.provider,
            payloadHash: Math.random().toString(16).substring(2, 14) + '...',
            status: 'REJECTED',
            riskLevel: action.riskLevel,
            argumentsDigest: feedbackNote ? `Batch Note: ${feedbackNote}` : 'Rejected in batch operation',
            user: 'tushar',
            latencyMs: 10,
            timestamp: now,
          });
          return { ...action, status: 'rejected' as const, feedbackNote: feedbackNote || 'Rejected in batch operation by operator.' };
        }
        return action;
      });
      return { ...prev, actions: updatedActions, auditLogs: [...newAuditLogs, ...prev.auditLogs] };
    });
  };

  const testConnection = async (connectionId: string) => {
    const connection = state.connections.find((item) => item.id === connectionId);
    if (!connection) throw new Error('Connector was not found.');
    throw new Error(`Live health checks are not configured for ${connection.name}.`);
  };

  const toggleConnection = (connectionId: string, isEnabled: boolean) => {
    setState((prev) => ({ ...prev, connections: prev.connections.map((c) => (c.id === connectionId ? { ...c, isEnabled } : c)) }));
  };

  const addConnection = (conn: Connection) => {
    setState((prev) => ({ ...prev, connections: [conn, ...prev.connections] }));
  };

  const generatePlanFromIntent = (_prompt: string) => {
    throw new Error('Live tool planning is not configured in this build.');
  };

  const executePlanStep = async (_stepNumber: number) => {
    throw new Error('Live tool execution is not configured in this build.');
  };

  const sendChatMessage = async (content: string, modelId: string, systemPrompt?: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now().toString(36)}`,
      conversationId: state.activeConversationId,
      role: 'user',
      content,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const botMsgId = `msg-${(Date.now() + 1).toString(36)}`;
    const placeholderBot: ChatMessage = {
      id: botMsgId,
      conversationId: state.activeConversationId,
      role: 'assistant',
      content: '',
      modelId,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setState((prev) => ({ ...prev, messages: [...prev.messages, userMsg, placeholderBot] }));

    const history = [...state.messages, userMsg]
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-30)
      .map((m) => ({ role: m.role, content: m.content }));

    const startedAt = performance.now();
    const body = JSON.stringify({ messages: history, systemPrompt, model: modelId });

    let usedStreaming = false;
    try {
      const streamRes = await authenticatedFetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body,
      });

      if (streamRes.ok && streamRes.body) {
        usedStreaming = true;
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let finalUsage: { promptTokens?: number; completionTokens?: number } | undefined;
        let finalModel = modelId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'delta' && typeof event.text === 'string') {
                fullText += event.text;
                const snapshot = fullText;
                setState((prev) => ({
                  ...prev,
                  messages: prev.messages.map((m) => (m.id === botMsgId ? { ...m, content: snapshot } : m)),
                }));
              } else if (event.type === 'done') {
                if (typeof event.text === 'string') fullText = event.text;
                finalUsage = event.usage;
                if (event.model) finalModel = event.model;
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Streaming error');
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message === 'Streaming error') throw parseErr;
            }
          }
        }

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content: fullText,
                  modelId: finalModel,
                  tokenStats: {
                    promptTokens: finalUsage?.promptTokens ?? 0,
                    completionTokens: finalUsage?.completionTokens ?? 0,
                    latencyMs: Math.round(performance.now() - startedAt),
                  },
                }
              : m
          ),
        }));

        if (!fullText.trim()) {
          throw new Error('The AI provider returned an empty response. Try rephrasing your message.');
        }
        return;
      }
    } catch (streamErr) {
      console.warn('Streaming unavailable, falling back:', streamErr);
    }

    if (!usedStreaming) {
      const response = await authenticatedFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      let result: {
        error?: string;
        code?: string;
        text?: string;
        usage?: { promptTokens?: number; completionTokens?: number };
        model?: string;
      };

      try {
        result = await response.json();
      } catch {
        setState((prev) => ({ ...prev, messages: prev.messages.filter((m) => m.id !== botMsgId) }));
        throw new Error('The chat service returned an invalid response. Check that the server is running.');
      }

      if (!response.ok) {
        setState((prev) => ({ ...prev, messages: prev.messages.filter((m) => m.id !== botMsgId) }));
        if (result.code === 'MISSING_API_KEY' || result.code === 'INVALID_API_KEY') {
          throw new Error(result.error || 'Gemini API key is missing or invalid. Add GEMINI_API_KEY to your environment.');
        }
        if (result.code === 'RATE_LIMIT' || response.status === 429) {
          throw new Error(result.error || 'Rate limit reached. Please wait a moment and try again.');
        }
        if (response.status === 503) {
          throw new Error(result.error || 'AI service is temporarily unavailable. Check your Gemini API key configuration.');
        }
        throw new Error(result.error || `Chat request failed (${response.status}).`);
      }

      if (typeof result.text !== 'string' || !result.text.trim()) {
        setState((prev) => ({ ...prev, messages: prev.messages.filter((m) => m.id !== botMsgId) }));
        throw new Error('The AI provider returned an empty response. Try rephrasing your message.');
      }

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content: result.text!,
                modelId: result.model || modelId,
                tokenStats: {
                  promptTokens: result.usage?.promptTokens ?? 0,
                  completionTokens: result.usage?.completionTokens ?? 0,
                  latencyMs: Math.round(performance.now() - startedAt),
                },
              }
            : m
        ),
      }));
    }
  };

  const clearMessages = () => {
    setState((prev) => ({ ...prev, messages: [] }));
  };

  const toggleAutomation = (id: string, isEnabled: boolean) => {
    setState((prev) => ({ ...prev, automations: prev.automations.map((a) => (a.id === id ? { ...a, isEnabled } : a)) }));
  };

  const addAutomation = (automation: Automation) => {
    setState((prev) => ({
      ...prev,
      automations: [{ ...automation, isEnabled: false, lastRun: undefined, lastStatus: undefined, totalRuns: 0 }, ...prev.automations],
    }));
  };

  const deleteAutomation = (id: string) => {
    setState((prev) => ({ ...prev, automations: prev.automations.filter((a) => a.id !== id) }));
  };

  const triggerAutomation = async (_id: string) => {
    throw new Error('Automation execution is not configured in this build.');
  };

  const toggleProjectTask = (projectId: string, taskId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id === projectId) {
          const updatedTasks = p.pendingTasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
          const completedCount = updatedTasks.filter((t) => t.completed).length;
          const completionPct = Math.round((completedCount / updatedTasks.length) * 100);
          return { ...p, pendingTasks: updatedTasks, completionPct };
        }
        return p;
      }),
    }));
  };

  const addProject = (project: AIProject) => {
    setState((prev) => ({ ...prev, projects: [project, ...prev.projects] }));
  };

  const updateGatewaySettings = (newSettings: Partial<GatewaySettings>) => {
    setState((prev) => ({ ...prev, gatewaySettings: { ...prev.gatewaySettings, ...newSettings } }));
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'> & { id?: string }) => {
    const newNotif: NotificationItem = {
      id: item.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: item.title,
      message: item.message,
      type: item.type,
      priority: item.priority || 'medium',
      timestamp: new Date().toISOString(),
      read: false,
      actionLabel: item.actionLabel,
      actionTab: item.actionTab,
      relatedEntityId: item.relatedEntityId,
      errorDetails: item.errorDetails,
      metadata: item.metadata,
    };
    if (state.notificationSoundEnabled) {
      if (newNotif.type === 'TASK_COMPLETED') notificationSound.playTaskCompleted();
      else if (newNotif.type === 'TASK_FAILED') notificationSound.playTaskFailed();
      else if (newNotif.type === 'APPROVAL_REQUIRED') notificationSound.playApprovalRequired();
    }
    setState((prev) => ({ ...prev, notifications: [newNotif, ...prev.notifications] }));
  };

  const markNotificationAsRead = (id: string) => {
    setState((prev) => ({ ...prev, notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  };

  const markAllNotificationsAsRead = () => {
    setState((prev) => ({ ...prev, notifications: prev.notifications.map((n) => ({ ...n, read: true })) }));
  };

  const dismissNotification = (id: string) => {
    setState((prev) => ({ ...prev, notifications: prev.notifications.filter((n) => n.id !== id) }));
  };

  const clearAllNotifications = () => {
    setState((prev) => ({ ...prev, notifications: [] }));
  };

  const toggleNotificationSound = () => {
    setState((prev) => ({ ...prev, notificationSoundEnabled: !prev.notificationSoundEnabled }));
  };

  const simulateTaskCompleted = (customTitle?: string, customMessage?: string) => {
    addNotification({
      title: customTitle || 'Automated Task Completed',
      message: customMessage || 'Data pipeline sync completed across 4 connected MCP providers in 320ms.',
      type: 'TASK_COMPLETED',
      priority: 'low',
      actionLabel: 'View Audit Ledger',
      actionTab: 'audit',
    });
  };

  const simulateTaskFailed = (customTitle?: string, customError?: string) => {
    addNotification({
      title: customTitle || 'Automated Task Failed',
      message: customError || 'Sandbox policy violation: Write attempt blocked for /var/log/audit.log',
      type: 'TASK_FAILED',
      priority: 'high',
      actionLabel: 'View Details',
      actionTab: 'audit',
      errorDetails: customError,
    });
  };

  const simulateUrgentApproval = () => {
    addNotification({
      title: 'Approval Required',
      message: 'High-risk action waiting for operator review in the Approval Queue.',
      type: 'APPROVAL_REQUIRED',
      priority: 'urgent',
      actionLabel: 'Review Now',
      actionTab: 'approvals',
    });
  };

  const resetToDefaults = () => {
    setState({
      models: INITIAL_MODELS,
      connections: DEFAULT_CONNECTIONS,
      tools: INITIAL_TOOLS,
      actions: INITIAL_ACTIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
      localFiles: INITIAL_LOCAL_FILES,
      localAgent: INITIAL_LOCAL_AGENT,
      automations: INITIAL_AUTOMATIONS,
      projects: INITIAL_PROJECTS,
      gatewaySettings: INITIAL_GATEWAY_SETTINGS,
      conversations: [INITIAL_CONVERSATION],
      activeConversationId: INITIAL_CONVERSATION.id,
      messages: INITIAL_MESSAGES,
      currentPlanSteps: [],
      notifications: INITIAL_NOTIFICATIONS,
      notificationSoundEnabled: true,
    });
  };

  return {
    state,
    approveAction,
    rejectAction,
    batchApproveActions,
    batchRejectActions,
    testConnection,
    toggleConnection,
    addConnection,
    generatePlanFromIntent,
    executePlanStep,
    sendChatMessage,
    clearMessages,
    toggleAutomation,
    addAutomation,
    deleteAutomation,
    triggerAutomation,
    toggleProjectTask,
    addProject,
    updateGatewaySettings,
    resetToDefaults,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    clearAllNotifications,
    toggleNotificationSound,
    simulateTaskCompleted,
    simulateTaskFailed,
    simulateUrgentApproval,
  };
}
