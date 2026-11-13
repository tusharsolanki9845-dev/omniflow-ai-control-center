export type RiskLevel = 'safe' | 'elevated' | 'critical';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending_auth';

export type ConnectionCategory = 'cloud' | 'mcp' | 'local';

export interface Connection {
  id: string;
  name: string;
  provider: string; // e.g., 'notion', 'gmail', 'slack', 'google_drive', 'github', 'filesystem_mcp', 'brave_search', 'local_agent'
  category: ConnectionCategory;
  status: ConnectionStatus;
  scopes: string[];
  riskLevel: RiskLevel;
  credentialsRef?: string;
  endpoint?: string;
  description: string;
  icon: string;
  lastTestedAt?: string;
  latencyMs?: number;
  isEnabled: boolean;
  version?: string;
}

export type LLMProvider = 'openrouter' | 'litellm' | 'google' | 'anthropic' | 'openai' | 'local_ollama';

export interface ModelConfig {
  id: string;
  name: string;
  provider: LLMProvider;
  modelId: string;
  description: string;
  contextWindow: number;
  costPer1kInput: number; // in USD
  costPer1kOutput: number; // in USD
  latencyAvgMs: number;
  capabilities: ('text' | 'reasoning' | 'code' | 'vision' | 'tools' | 'streaming')[];
  isFavorite?: boolean;
}

export interface ToolDefinition {
  id: string;
  connectionId: string;
  name: string;
  displayName: string;
  description: string;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  parametersSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; required?: boolean }>;
    required?: string[];
  };
}

export interface ActionPlanStep {
  stepNumber: number;
  title: string;
  toolId: string;
  toolName: string;
  connectionProvider: string;
  arguments: Record<string, any>;
  riskLevel: RiskLevel;
  status: 'pending' | 'running' | 'completed' | 'blocked' | 'waiting_approval' | 'rejected' | 'failed';
  requiresApproval: boolean;
  result?: any;
  error?: string;
  executionTimeMs?: number;
}

export interface Action {
  id: string;
  userId: string;
  promptIntent: string;
  toolId: string;
  toolName: string;
  provider: string;
  arguments: Record<string, any>;
  status: 'pending_approval' | 'approved' | 'executed' | 'rejected' | 'failed';
  approvalRequired: boolean;
  riskLevel: RiskLevel;
  targetResource: string;
  diffPreview?: {
    before?: string | Record<string, any>;
    after?: string | Record<string, any>;
    summary: string;
  };
  result?: any;
  createdAt: string;
  executedAt?: string;
  approvedBy?: string;
  feedbackNote?: string;
}

export interface AuditLog {
  id: string;
  actionId?: string;
  event: string;
  modelUsed: string;
  tool: string;
  provider: string;
  payloadHash: string;
  status: 'SUCCESS' | 'BLOCKED' | 'APPROVED' | 'REJECTED' | 'FAILED' | 'PENDING';
  riskLevel: RiskLevel;
  argumentsDigest: string;
  errorDetails?: string;
  user: string;
  latencyMs: number;
  timestamp: string;
  correlationId?: string;
  httpStatus?: number;
  rawRequest?: Record<string, any> | string;
  rawResponse?: Record<string, any> | string;
  errorStackTrace?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  reasoning?: string;
  toolCalls?: {
    id: string;
    toolName: string;
    args: Record<string, any>;
    result?: any;
    status: 'pending' | 'success' | 'failed' | 'requires_approval';
  }[];
  tokenStats?: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
    latencyMs: number;
  };
  modelId?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  systemPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalDeviceAgentConfig {
  status: 'connected' | 'disconnected' | 'authenticating';
  tunnelEndpoint: string;
  port: number;
  sandboxed: boolean;
  allowedDirectories: string[];
  allowlistCommands: string[];
  cpuUsagePct: number;
  memoryUsageMb: number;
  uptimeSeconds: number;
}

export interface LocalFile {
  path: string;
  name: string;
  directory: string;
  sizeBytes: number;
  modifiedAt: string;
  mimeType: string;
  extractedSnippet?: string;
  permissions: 'read-only' | 'read-write-approved';
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: 'cron' | 'webhook' | 'event' | 'manual';
  cronSchedule?: string;
  modelId: string;
  steps: {
    title: string;
    toolId: string;
    promptTemplate: string;
  }[];
  isEnabled: boolean;
  lastRun?: string;
  lastStatus?: 'success' | 'failed' | 'waiting_approval';
  totalRuns: number;
}

export interface AIProject {
  id: string;
  name: string;
  repoName: string;
  githubUrl: string;
  liveUrl?: string;
  aiToolOrigin: 'v0' | 'cursor' | 'claude_artifacts' | 'bolt' | 'replit' | 'chatgpt' | 'gemini' | 'workstation';
  description: string;
  techStack: string[];
  completionPct: number;
  status: 'ready_to_ship' | 'in_progress' | 'blocked' | 'needs_review';
  nextAction: string;
  pendingTasks: { id: string; title: string; completed: boolean; priority: 'high' | 'medium' | 'low' }[];
  lastSyncedAt: string;
}

export interface GatewaySettings {
  primaryGateway: 'litellm' | 'openrouter' | 'gemini_direct';
  gatewayEndpoint: string;
  defaultModelId: string;
  defaultDenyHighRisk: boolean;
  localSandboxingStrict: boolean;
  require2FAForCritical: boolean;
  auditRetentionDays: number;
  monthlyBudgetCapUsd: number;
  currentMonthSpendUsd: number;
}

export type ThemeMode = 'dark' | 'light' | 'system' | 'schedule';

export interface ThemeScheduleConfig {
  mode: ThemeMode;
  sunriseTime: string; // e.g., "06:30"
  sunsetTime: string;  // e.g., "18:30"
  useGeolocation: boolean;
  latitude?: number;
  longitude?: number;
  autoDimming: boolean;
}

export type NotificationType = 'TASK_COMPLETED' | 'TASK_FAILED' | 'APPROVAL_REQUIRED' | 'SYSTEM_INFO';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionTab?: string;
  relatedEntityId?: string;
  errorDetails?: string;
  metadata?: Record<string, any>;
}

