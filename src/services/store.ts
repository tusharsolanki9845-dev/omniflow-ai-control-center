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

const STORAGE_KEY = 'omniflow_state_v1.1';

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

function getInitialState(): OmniFlowState {
  if (typeof window === 'undefined') {
    return {
      models: INITIAL_MODELS,
      connections: INITIAL_CONNECTIONS,
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
    const raw = localStorage.getItem(STORAGE_KEY);
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
        models: parsed.models || INITIAL_MODELS,
        connections: parsed.connections || INITIAL_CONNECTIONS,
        tools: parsed.tools || INITIAL_TOOLS,
        actions: parsed.actions || INITIAL_ACTIONS,
        auditLogs: mergedAuditLogs.length ? mergedAuditLogs : INITIAL_AUDIT_LOGS,
        localFiles: parsed.localFiles || INITIAL_LOCAL_FILES,
        localAgent: parsed.localAgent || INITIAL_LOCAL_AGENT,
        automations: parsed.automations || INITIAL_AUTOMATIONS,
        projects: parsed.projects || INITIAL_PROJECTS,
        gatewaySettings: parsed.gatewaySettings || INITIAL_GATEWAY_SETTINGS,
        conversations: parsed.conversations || [INITIAL_CONVERSATION],
        activeConversationId: parsed.activeConversationId || INITIAL_CONVERSATION.id,
        messages: parsed.messages || INITIAL_MESSAGES,
        currentPlanSteps: parsed.currentPlanSteps || [],
        notifications: mergedNotifications.length ? mergedNotifications : INITIAL_NOTIFICATIONS,
        notificationSoundEnabled: parsed.notificationSoundEnabled !== undefined ? parsed.notificationSoundEnabled : true,
      };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }

  return {
    models: INITIAL_MODELS,
    connections: INITIAL_CONNECTIONS,
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

export function useOmniFlowStore() {
  const [state, setState] = useState<OmniFlowState>(getInitialState);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [state]);

  // Actions & Approvals
  const approveAction = (actionId: string) => {
    setState((prev) => {
      const action = prev.actions.find((a) => a.id === actionId);
      if (!action) return prev;

      const updatedAction: Action = {
        ...action,
        status: 'approved',
        executedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        approvedBy: 'tushar (Admin Approval)',
        result: {
          success: true,
          status: 'COMMITTED',
          target: action.targetResource,
          details: 'Dispatched successfully via standardized connector gateway.',
        },
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

      return {
        ...prev,
        actions: prev.actions.map((a) => (a.id === actionId ? updatedAction : a)),
        auditLogs: [newAuditLog, ...prev.auditLogs],
      };
    });
  };

  const rejectAction = (actionId: string, feedbackNote?: string) => {
    setState((prev) => {
      const action = prev.actions.find((a) => a.id === actionId);
      if (!action) return prev;

      const updatedAction: Action = {
        ...action,
        status: 'rejected',
        feedbackNote: feedbackNote || 'Rejected by operator in approval queue.',
      };

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

      return {
        ...prev,
        actions: prev.actions.map((a) => (a.id === actionId ? updatedAction : a)),
        auditLogs: [newAuditLog, ...prev.auditLogs],
      };
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
            result: {
              success: true,
              status: 'COMMITTED',
              target: action.targetResource,
              details: 'Dispatched in atomic batch via standardized connector gateway.',
            },
          };
        }
        return action;
      });

      return {
        ...prev,
        actions: updatedActions,
        auditLogs: [...newAuditLogs, ...prev.auditLogs],
      };
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
          return {
            ...action,
            status: 'rejected' as const,
            feedbackNote: feedbackNote || 'Rejected in batch operation by operator.',
          };
        }
        return action;
      });

      return {
        ...prev,
        actions: updatedActions,
        auditLogs: [...newAuditLogs, ...prev.auditLogs],
      };
    });
  };

  // Connectors
  const testConnection = async (connectionId: string) => {
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
    const latency = Math.round(performance.now() - start);

    setState((prev) => {
      const updated = prev.connections.map((c) => {
        if (c.id === connectionId) {
          return {
            ...c,
            status: 'connected' as const,
            latencyMs: latency,
            lastTestedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
        }
        return c;
      });

      return { ...prev, connections: updated };
    });
  };

  const toggleConnection = (connectionId: string, isEnabled: boolean) => {
    setState((prev) => ({
      ...prev,
      connections: prev.connections.map((c) => (c.id === connectionId ? { ...c, isEnabled } : c)),
    }));
  };

  const addConnection = (conn: Connection) => {
    setState((prev) => ({
      ...prev,
      connections: [conn, ...prev.connections],
    }));
  };

  // Plan Decomposition in Action Console
  const generatePlanFromIntent = (prompt: string) => {
    const lower = prompt.toLowerCase();
    const steps: ActionPlanStep[] = [];

    if (lower.includes('portfolio') || lower.includes('vercel')) {
      steps.push({
        stepNumber: 1,
        title: 'Probe live deployment at tushar-portfolio-live.vercel.app',
        toolId: 'tool-brave-web-search',
        toolName: 'http_client.audit_endpoint',
        connectionProvider: 'brave_search',
        arguments: {
          url: 'https://tushar-portfolio-live.vercel.app',
          assertStatus: 200,
          validateSchema: 'Person JSON-LD',
        },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 2,
        title: 'Synthesize verified project showcase diff from active AI repositories',
        toolId: 'tool-local-list-files',
        toolName: 'llm.generate_code_patch',
        connectionProvider: 'litellm',
        arguments: {
          targetFile: 'src/data/portfolioData.ts',
          newBuilds: ['Webclient Hunter AI', 'AI Duniya', 'AlphaTech Solutions', 'ProctorX'],
        },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 3,
        title: 'Stage commit to tusharsolanki9845-dev/tushar-portfolio-vercel',
        toolId: 'tool-github-commit',
        toolName: 'github.create_commit',
        connectionProvider: 'github',
        arguments: {
          repo: 'tusharsolanki9845-dev/tushar-portfolio-vercel',
          branch: 'main',
          message: 'chore: sync verified 2026 AI builds and technical milestones',
        },
        riskLevel: 'elevated',
        status: 'pending',
        requiresApproval: true,
      });
    } else if (lower.includes('hunter') || lower.includes('outreach')) {
      steps.push({
        stepNumber: 1,
        title: 'Inspect Webclient-hunter-ai repo structure & lead schema',
        toolId: 'tool-brave-web-search',
        toolName: 'github.get_repository_tree',
        connectionProvider: 'github',
        arguments: { repo: 'tusharsolanki9845-dev/Webclient-hunter-ai', path: 'src/services' },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 2,
        title: 'Generate personalized outreach engine with sub-second latency',
        toolId: 'tool-local-list-files',
        toolName: 'llm.generate_code_patch',
        connectionProvider: 'litellm',
        arguments: { target: 'src/services/outreachEngine.ts', model: 'gemini-3.8-flash' },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 3,
        title: 'Open Pull Request: feature/outreach-generator on GitHub',
        toolId: 'tool-github-commit',
        toolName: 'github.create_pull_request',
        connectionProvider: 'github',
        arguments: {
          repo: 'tusharsolanki9845-dev/Webclient-hunter-ai',
          head: 'feature/outreach-generator',
          base: 'main',
          title: 'feat: automated personalized outreach engine',
        },
        riskLevel: 'elevated',
        status: 'pending',
        requiresApproval: true,
      });
    } else if (lower.includes('cursor') || lower.includes('v0') || lower.includes('audit') || lower.includes('scan')) {
      steps.push({
        stepNumber: 1,
        title: 'Query active milestones across all 5 AI repositories',
        toolId: 'tool-brave-web-search',
        toolName: 'github.list_repository_issues',
        connectionProvider: 'github',
        arguments: { user: 'tusharsolanki9845-dev', state: 'open' },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 2,
        title: 'Compile prioritized sprint roadmap with risk levels',
        toolId: 'tool-brave-web-search',
        toolName: 'llm.synthesize_summary',
        connectionProvider: 'litellm',
        arguments: { strategy: 'high-impact ready-to-ship first' },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 3,
        title: 'Sync sprint roadmap to GitHub Project Board',
        toolId: 'tool-github-commit',
        toolName: 'github.update_project_board',
        connectionProvider: 'github',
        arguments: { board: 'OmniFlow 2026 AI Sprint' },
        riskLevel: 'elevated',
        status: 'pending',
        requiresApproval: true,
      });
    } else if (lower.includes('invoice') || lower.includes('pdf') || lower.includes('notion')) {
      steps.push({
        stepNumber: 1,
        title: 'Inspect sandboxed Downloads directory for invoice files',
        toolId: 'tool-local-list-files',
        toolName: 'local_agent.list_files',
        connectionProvider: 'local_agent',
        arguments: { directory: '~/Downloads', pattern: '*.pdf' },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 2,
        title: 'Extract total, vendor, and line items from invoice_acme_q3.pdf',
        toolId: 'tool-local-extract-pdf',
        toolName: 'local_agent.extract_pdf_data',
        connectionProvider: 'local_agent',
        arguments: { filePath: '~/Downloads/invoice_acme_q3.pdf', targetFields: 'vendor, total, date, invoiceNumber' },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 3,
        title: 'Create Notion expense entry for Acme Cloud ($1,429.50)',
        toolId: 'tool-notion-create-page',
        toolName: 'notion.create_database_page',
        connectionProvider: 'notion',
        arguments: {
          database: 'Notion Expenses 2026',
          properties: { Vendor: 'Acme Cloud Services', Amount: 1429.5, Currency: 'USD', Date: '2026-11-04' },
        },
        riskLevel: 'elevated',
        status: 'pending',
        requiresApproval: true,
      });
    } else if (lower.includes('slack') || lower.includes('summary') || lower.includes('pr')) {
      steps.push({
        stepNumber: 1,
        title: 'Retrieve merged pull requests from GitHub repository',
        toolId: 'tool-brave-web-search',
        toolName: 'github.list_pull_requests',
        connectionProvider: 'github',
        arguments: { repo: 'omniflow/gateway-core', state: 'merged', since: '24h' },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 2,
        title: 'Draft sprint release briefing and changelog',
        toolId: 'tool-brave-web-search',
        toolName: 'llm.synthesize_summary',
        connectionProvider: 'litellm',
        arguments: { focus: 'developer impact & security updates' },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 3,
        title: 'Broadcast briefing to #dev-updates Slack channel',
        toolId: 'tool-slack-post-message',
        toolName: 'slack.post_message',
        connectionProvider: 'slack',
        arguments: { channel: '#dev-updates', text: 'Daily Standup & Merged PR Digest' },
        riskLevel: 'elevated',
        status: 'pending',
        requiresApproval: true,
      });
    } else {
      // General 2-step plan
      steps.push({
        stepNumber: 1,
        title: 'Query connected services and context sources',
        toolId: 'tool-brave-web-search',
        toolName: 'brave_search.query',
        connectionProvider: 'brave_search',
        arguments: { query: prompt },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
      steps.push({
        stepNumber: 2,
        title: 'Format response and propose structured follow-up action',
        toolId: 'tool-local-list-files',
        toolName: 'local_agent.list_files',
        connectionProvider: 'local_agent',
        arguments: { directory: '~/Downloads' },
        riskLevel: 'safe',
        status: 'pending',
        requiresApproval: false,
      });
    }

    setState((prev) => ({ ...prev, currentPlanSteps: steps }));
  };

  const executePlanStep = async (stepNumber: number) => {
    setState((prev) => ({
      ...prev,
      currentPlanSteps: prev.currentPlanSteps.map((s) =>
        s.stepNumber === stepNumber ? { ...s, status: 'running' } : s
      ),
    }));

    await new Promise((r) => setTimeout(r, 600));

    setState((prev) => {
      const step = prev.currentPlanSteps.find((s) => s.stepNumber === stepNumber);
      if (!step) return prev;

      let nextStatus: ActionPlanStep['status'] = 'completed';
      let resultData: any = { status: 'OK', recordsFound: 1 };

      if (step.requiresApproval) {
        nextStatus = 'waiting_approval';
        const actId = `act-${Date.now().toString(36)}`;
        resultData = {
          message: 'Paused for security: Destructive or external write requires manual confirmation in Approval Queue.',
          queuedActionId: actId,
        };

        // Create an approval queue entry
        const newAction: Action = {
          id: actId,
          userId: 'user-tushar',
          promptIntent: step.title,
          toolId: step.toolId,
          toolName: step.toolName,
          provider: step.connectionProvider,
          arguments: step.arguments,
          status: 'pending_approval',
          approvalRequired: true,
          riskLevel: step.riskLevel,
          targetResource: `${step.connectionProvider.toUpperCase()} / Resource`,
          diffPreview: {
            before: '(No prior state)',
            after: step.arguments,
            summary: `Automated plan execution step #${step.stepNumber}: ${step.title}`,
          },
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };

        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: 'Urgent Manual Approval Required',
          message: `Plan step #${step.stepNumber} "${step.title}" requires confirmation before execution.`,
          type: 'APPROVAL_REQUIRED',
          priority: 'urgent',
          timestamp: new Date().toISOString(),
          read: false,
          actionLabel: 'Review in Approvals',
          actionTab: 'approvals',
          relatedEntityId: actId,
        };

        if (prev.notificationSoundEnabled) {
          notificationSound.playApprovalRequired();
        }

        return {
          ...prev,
          notifications: [newNotif, ...prev.notifications],
          actions: [newAction, ...prev.actions],
          currentPlanSteps: prev.currentPlanSteps.map((s) =>
            s.stepNumber === stepNumber ? { ...s, status: nextStatus, result: resultData } : s
          ),
        };
      }

      // Completed safely
      const completedNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: 'Automated Task Completed',
        message: `Plan step #${step.stepNumber} "${step.title}" executed safely in 160ms.`,
        type: 'TASK_COMPLETED',
        priority: 'low',
        timestamp: new Date().toISOString(),
        read: false,
        actionLabel: 'View Audit Ledger',
        actionTab: 'audit',
      };

      if (prev.notificationSoundEnabled) {
        notificationSound.playTaskCompleted();
      }

      return {
        ...prev,
        notifications: [completedNotif, ...prev.notifications],
        currentPlanSteps: prev.currentPlanSteps.map((s) =>
          s.stepNumber === stepNumber ? { ...s, status: nextStatus, result: resultData } : s
        ),
      };
    });
  };

  // Chat sending
  const sendChatMessage = async (
    content: string,
    modelId: string,
    systemPrompt?: string
  ) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now().toString(36)}`,
      conversationId: state.activeConversationId,
      role: 'user',
      content,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
    }));

    // Server or simulated LLM response
    const selectedModel = state.models.find((m) => m.id === modelId) || state.models[0];
    const isReasoning = selectedModel.capabilities.includes('reasoning');

    let assistantText = '';
    let reasoning = '';
    let toolCalls: ChatMessage['toolCalls'] = undefined;

    const lower = content.toLowerCase();

    if (lower.includes('invoice') || (lower.includes('downloads') && lower.includes('notion'))) {
      assistantText = `I analyzed your request against current security rules.\n\n1. Found **invoice_acme_q3.pdf** ($1,429.50) in \`~/Downloads\` via Local Agent.\n2. Formatted a structured database insertion payload.\n3. **Elevated Risk**: Because writing to your Notion database modifies external workspace state, I queued the write action in your **Approval Queue**.\n\nPlease inspect the preview diff and click Approve to proceed.`;
      reasoning = `Goal: Extract invoice and write to Notion.\nPlan: Check folder permissions -> parse PDF -> formulate Notion row -> gate behind Approval Queue.\nRisk Assessment: Local read = SAFE; Notion write = ELEVATED. Default-deny policy applied.`;
      toolCalls = [
        {
          id: 'call-1',
          toolName: 'local_agent.list_files',
          args: { directory: '~/Downloads', pattern: '*.pdf' },
          result: { files: ['invoice_acme_q3.pdf'] },
          status: 'success',
        },
        {
          id: 'call-2',
          toolName: 'local_agent.extract_pdf_data',
          args: { filePath: '~/Downloads/invoice_acme_q3.pdf' },
          result: { vendor: 'Acme Cloud', total: 1429.5, invoiceId: 'INV-2026-9842' },
          status: 'success',
        },
        {
          id: 'call-3',
          toolName: 'notion.create_database_page',
          args: { database: 'Notion Expenses 2026', amount: 1429.5 },
          status: 'requires_approval',
        },
      ];
    } else if (lower.includes('status') || lower.includes('connectors') || lower.includes('health')) {
      const activeCount = state.connections.filter((c) => c.status === 'connected').length;
      assistantText = `**OmniFlow System Health & Connector Status**\n\n- **Active Connectors**: ${activeCount} of ${state.connections.length} online.\n- **Local Agent**: Connected at \`http://127.0.0.1:8006\` (WireGuard sandboxed, ${state.localAgent.allowedDirectories.length} allowed folders).\n- **Primary Gateway**: ${state.gatewaySettings.primaryGateway.toUpperCase()} Proxy.\n- **Pending Approvals**: ${state.actions.filter((a) => a.status === 'pending_approval').length} action(s) awaiting your review.`;
      reasoning = `Checking status of all connected tools, local tunnel health, and security guardrail statistics.`;
    } else {
      assistantText = `OmniFlow Gateway processed your query through **${selectedModel.name}**.\n\nI can execute tasks across your connected cloud tools (Notion, Gmail, Slack, Drive), Model Context Protocol (MCP) servers, and your sandboxed local device agent with strict policy enforcement.`;
      if (isReasoning) {
        reasoning = `Query evaluated: "${content.substring(0, 40)}...". Model Context Protocol schemas inspected. Safe execution path verified.`;
      }
    }

    const promptTokens = Math.floor(content.length / 3) + 120;
    const completionTokens = Math.floor(assistantText.length / 3) + (reasoning ? 100 : 0);
    const cost =
      (promptTokens / 1000) * selectedModel.costPer1kInput +
      (completionTokens / 1000) * selectedModel.costPer1kOutput;

    const botMsg: ChatMessage = {
      id: `msg-${(Date.now() + 1).toString(36)}`,
      conversationId: state.activeConversationId,
      role: 'assistant',
      content: assistantText,
      reasoning: isReasoning ? reasoning : undefined,
      toolCalls,
      tokenStats: {
        promptTokens,
        completionTokens,
        totalCost: Number(cost.toFixed(6)),
        latencyMs: selectedModel.latencyAvgMs + Math.floor(Math.random() * 40),
      },
      modelId,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, botMsg],
      gatewaySettings: {
        ...prev.gatewaySettings,
        currentMonthSpendUsd: Number((prev.gatewaySettings.currentMonthSpendUsd + cost).toFixed(4)),
      },
    }));
  };

  const clearMessages = () => {
    setState((prev) => ({ ...prev, messages: [] }));
  };

  const toggleAutomation = (id: string, isEnabled: boolean) => {
    setState((prev) => ({
      ...prev,
      automations: prev.automations.map((a) => (a.id === id ? { ...a, isEnabled } : a)),
    }));
  };

  const addAutomation = (automation: Automation) => {
    setState((prev) => ({
      ...prev,
      automations: [automation, ...prev.automations],
    }));
  };

  const deleteAutomation = (id: string) => {
    setState((prev) => ({
      ...prev,
      automations: prev.automations.filter((a) => a.id !== id),
    }));
  };

  const triggerAutomation = async (id: string) => {
    const targetAuto = state.automations.find((a) => a.id === id);
    const autoName = targetAuto ? targetAuto.name : 'Automated Task';

    let nextStatus: 'success' | 'waiting_approval' | 'failed' = 'success';
    let notifType: NotificationType = 'TASK_COMPLETED';
    let notifPriority: NotificationPriority = 'medium';
    let notifTitle = `Automated Task Completed`;
    let notifMsg = `"${autoName}" executed all configured steps cleanly.`;
    let notifTab = 'automations';
    let actId: string | undefined = undefined;

    if (id === 'auto-01') {
      // Invoice ingestion triggers a sensitive Notion database write that requires manual approval
      nextStatus = 'waiting_approval';
      notifType = 'APPROVAL_REQUIRED';
      notifPriority = 'urgent';
      actId = `act-${Date.now().toString(36)}`;
      notifTitle = 'Urgent Manual Approval Required';
      notifMsg = `"${autoName}" parsed invoice data and queued an external Notion CRM insertion.`;
      notifTab = 'approvals';

      const queuedAction: Action = {
        id: actId,
        userId: 'user-tushar',
        promptIntent: `Ingest Acme Cloud invoice into Notion Expenses`,
        toolId: 'tool-notion-create-page',
        toolName: 'notion.create_database_page',
        provider: 'notion',
        arguments: { database: 'Notion Expenses 2026', vendor: 'Acme Cloud Services', amount: 1429.5 },
        status: 'pending_approval',
        approvalRequired: true,
        riskLevel: 'elevated',
        targetResource: 'Notion / Database',
        diffPreview: {
          summary: 'Append row: Acme Cloud Services ($1,429.50) [Automated ingestion]',
        },
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      setState((prev) => ({
        ...prev,
        actions: [queuedAction, ...prev.actions],
      }));
    } else {
      notifTitle = `Automated Task Completed`;
      notifMsg = `"${autoName}" completed in 210ms with zero policy errors.`;
    }

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: notifTitle,
      message: notifMsg,
      type: notifType,
      priority: notifPriority,
      timestamp: new Date().toISOString(),
      read: false,
      actionLabel: notifType === 'APPROVAL_REQUIRED' ? 'Review in Approvals' : 'View in Automations',
      actionTab: notifTab,
      relatedEntityId: actId || id,
    };

    if (state.notificationSoundEnabled) {
      if (notifType === 'APPROVAL_REQUIRED') notificationSound.playApprovalRequired();
      else if (notifType === 'TASK_COMPLETED') notificationSound.playTaskCompleted();
      else notificationSound.playTaskFailed();
    }

    setState((prev) => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications],
      automations: prev.automations.map((a) =>
        a.id === id
          ? {
              ...a,
              totalRuns: a.totalRuns + 1,
              lastRun: new Date().toISOString().replace('T', ' ').substring(0, 19),
              lastStatus: nextStatus,
            }
          : a
      ),
    }));
  };

  const toggleProjectTask = (projectId: string, taskId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id === projectId) {
          const updatedTasks = p.pendingTasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          );
          const completedCount = updatedTasks.filter((t) => t.completed).length;
          const completionPct = Math.round((completedCount / updatedTasks.length) * 100);
          return {
            ...p,
            pendingTasks: updatedTasks,
            completionPct,
          };
        }
        return p;
      }),
    }));
  };

  const syncProject = async (projectId: string) => {
    await new Promise((r) => setTimeout(r, 600));
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) }
          : p
      ),
    }));
  };

  const syncAllWithGitHubAPI = async () => {
    try {
      const res = await fetch('https://api.github.com/users/tusharsolanki9845-dev/repos');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setState((prev) => ({
            ...prev,
            projects: prev.projects.map((p) => {
              const remote = data.find(
                (r: any) => r.name.toLowerCase() === p.repoName.toLowerCase()
              );
              return {
                ...p,
                description: (remote && remote.description) || p.description,
                lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              };
            }),
          }));
          return { success: true, count: data.length };
        }
      }
    } catch (e) {
      console.warn('GitHub API offline or rate-limited; applied local sync timestamp:', e);
    }

    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => ({
        ...p,
        lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      })),
    }));
    return { success: true, count: 5 };
  };

  const stageProjectTaskCode = (projectId: string, taskTitle: string) => {
    setState((prev) => {
      const proj = prev.projects.find((p) => p.id === projectId);
      if (!proj) return prev;

      const newAction: Action = {
        id: `act-code-${Date.now().toString(36)}`,
        userId: 'tushar-solanki',
        promptIntent: `Complete task: "${taskTitle}" for project ${proj.name}`,
        toolId: 'tool-github-commit',
        toolName: 'github.create_commit',
        provider: 'github',
        arguments: {
          repo: proj.repoName,
          branch: 'feature/task-completion',
          commitMessage: `feat: implement ${taskTitle}`,
          filesModified: ['src/components/Feature.tsx', 'src/types.ts'],
        },
        status: 'pending_approval',
        approvalRequired: true,
        riskLevel: 'elevated',
        targetResource: `GitHub / ${proj.repoName} (Branch: feature/task-completion)`,
        diffPreview: {
          before: '// Pending feature implementation',
          after: `+ // Implemented: ${taskTitle}\n+ export function executeFeature() { return { status: 'COMPLETE' }; }`,
          summary: `Commit and push changes for "${taskTitle}" to ${proj.repoName}`,
        },
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      return {
        ...prev,
        actions: [newAction, ...prev.actions],
      };
    });
  };

  const addProject = (project: AIProject) => {
    setState((prev) => ({
      ...prev,
      projects: [project, ...prev.projects],
    }));
  };

  const updateGatewaySettings = (newSettings: Partial<GatewaySettings>) => {
    setState((prev) => ({
      ...prev,
      gatewaySettings: { ...prev.gatewaySettings, ...newSettings },
    }));
  };

  const addNotification = (
    item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'> & { id?: string }
  ) => {
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

    setState((prev) => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications],
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsAsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const dismissNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  const clearAllNotifications = () => {
    setState((prev) => ({
      ...prev,
      notifications: [],
    }));
  };

  const toggleNotificationSound = () => {
    setState((prev) => ({
      ...prev,
      notificationSoundEnabled: !prev.notificationSoundEnabled,
    }));
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
      actionLabel: 'Inspect in Audit',
      actionTab: 'audit',
      errorDetails: 'ERR_PERMISSION_DENIED: Target destination outside allowlisted sandbox directories',
    });
  };

  const simulateUrgentApproval = (customTitle?: string, customAction?: string) => {
    const actId = `act-${Date.now().toString(36)}`;
    const newAction: Action = {
      id: actId,
      userId: 'user-tushar',
      promptIntent: customAction || 'Execute live schema patch on production Supabase instance',
      toolId: 'tool-postgres-query',
      toolName: 'postgres.execute_dml',
      provider: 'postgres_mcp',
      arguments: { schema: 'public', table: 'auth_tokens', operation: 'ROTATE_KEYS' },
      status: 'pending_approval',
      approvalRequired: true,
      riskLevel: 'critical',
      targetResource: 'PostgreSQL / auth_tokens',
      diffPreview: {
        before: { rotationScheduled: false },
        after: { rotationScheduled: true, gracePeriodHours: 24 },
        summary: 'Emergency API token rotation triggered by automated anomaly detection',
      },
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setState((prev) => ({
      ...prev,
      actions: [newAction, ...prev.actions],
    }));

    addNotification({
      title: customTitle || 'Urgent Manual Approval Required',
      message: customAction || 'Critical database operation queued: Automated key rotation awaiting manual signature.',
      type: 'APPROVAL_REQUIRED',
      priority: 'urgent',
      actionLabel: 'Review in Approvals',
      actionTab: 'approvals',
      relatedEntityId: actId,
    });
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      models: INITIAL_MODELS,
      connections: INITIAL_CONNECTIONS,
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
    syncProject,
    syncAllWithGitHubAPI,
    stageProjectTaskCode,
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
