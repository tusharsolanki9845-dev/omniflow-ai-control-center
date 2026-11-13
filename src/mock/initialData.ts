import {
  Connection,
  ModelConfig,
  ToolDefinition,
  Action,
  AuditLog,
  LocalDeviceAgentConfig,
  LocalFile,
  Automation,
  GatewaySettings,
  Conversation,
  ChatMessage,
  AIProject,
  NotificationItem,
} from '../types';

export const INITIAL_MODELS: ModelConfig[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    modelId: 'gemini-2.5-flash',
    description: 'Gemini model used by the configured server-side AI gateway.',
    contextWindow: 1048576,
    costPer1kInput: 0,
    costPer1kOutput: 0,
    latencyAvgMs: 0,
    capabilities: ['text', 'reasoning', 'code', 'vision'],
    isFavorite: true,
  },
];

export const INITIAL_CONNECTIONS: Connection[] = [];

export const INITIAL_TOOLS: ToolDefinition[] = [];

export const INITIAL_ACTIONS: Action[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_LOCAL_FILES: LocalFile[] = [];

export const INITIAL_LOCAL_AGENT: LocalDeviceAgentConfig = {
  status: 'disconnected',
  tunnelEndpoint: '',
  port: 0,
  sandboxed: false,
  allowedDirectories: [],
  allowlistCommands: [],
  cpuUsagePct: 0,
  memoryUsageMb: 0,
  uptimeSeconds: 0,
};

export const INITIAL_AUTOMATIONS: Automation[] = [];

export const INITIAL_GATEWAY_SETTINGS: GatewaySettings = {
  primaryGateway: 'gemini_direct',
  gatewayEndpoint: '/api/chat',
  defaultModelId: 'gemini-2.5-flash',
  defaultDenyHighRisk: true,
  localSandboxingStrict: true,
  require2FAForCritical: true,
  auditRetentionDays: 90,
  monthlyBudgetCapUsd: 0,
  currentMonthSpendUsd: 0,
};

export const INITIAL_CONVERSATION: Conversation = {
  id: 'conv-01',
  title: 'New conversation',
  modelId: 'gemini-2.5-flash',
  systemPrompt: 'You are OmniFlow Control Assistant. You cannot access local files, external services, or execute tools unless tools are explicitly provided in the current request.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_MESSAGES: ChatMessage[] = [];

export const INITIAL_PROJECTS: AIProject[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
