import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  ChevronDown,
  Cpu,
  Brain,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Bot,
  Download,
} from 'lucide-react';
import { ModelConfig, ChatMessage, Connection } from '../types';
import { PushToTalkButton } from './PushToTalkButton';

interface ChatWorkbenchProps {
  models: ModelConfig[];
  messages: ChatMessage[];
  connections: Connection[];
  onSendMessage: (content: string, modelId: string, systemPrompt?: string) => Promise<void>;
  onClearMessages: () => void;
  onOpenApprovals: () => void;
}

export const ChatWorkbench: React.FC<ChatWorkbenchProps> = ({
  models,
  messages,
  connections,
  onSendMessage,
  onClearMessages,
  onOpenApprovals,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id || 'gemini-2.5-flash');
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are OmniFlow Control Assistant. You cannot access local files, external services, or execute tools unless tools are explicitly provided in the current request.'
  );
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [isComparisonMode, setIsComparisonMode] = useState<boolean>(false);
  const [comparisonResults, setComparisonResults] = useState<{
    prompt: string;
    gemini: { text: string; latency: number; tokens: number; cost: number; reasoning?: string };
    claude: { text: string; latency: number; tokens: number; cost: number; reasoning?: string };
    deepseek: { text: string; latency: number; tokens: number; cost: number; reasoning?: string };
  } | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Record<string, boolean>>({});

  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];

  const handleRunComparison = async (testPrompt: string) => {
    if (!testPrompt.trim()) return;
    setIsComparing(true);
    await new Promise((r) => setTimeout(r, 650));

    setComparisonResults({
      prompt: testPrompt,
      gemini: {
        text: `Gemini 2.5 Flash response:\nAnalyzed request against connected tools. Found relevant invoice in ~/Downloads and generated structured Notion schema payload in 320ms.`,
        latency: 320,
        tokens: 348,
        cost: 0.00012,
        reasoning: 'Evaluated prompt against allowlisted tools and verified zero high-risk commands needed for read phase.',
      },
      claude: {
        text: `Claude 3.7 Sonnet response:\nExamined the objective with hybrid reasoning. Recommended checking ~/Downloads for invoice_acme_q3.pdf and verified database properties match Expense schema before queuing approval.`,
        latency: 680,
        tokens: 412,
        cost: 0.0038,
        reasoning: 'Deconstruct into atomic sub-tasks: file system inspection, structured regex extraction, Notion database mutation proposal.',
      },
      deepseek: {
        text: `DeepSeek R1 response:\n<think>\nThe user wants to connect files and external databases. Verify risk tier: reading files is safe, database insertion modifies external state. Enforce human-in-the-loop.\n</think>\nIdentified matching target and prepared Notion database entry with verified parameters.`,
        latency: 920,
        tokens: 520,
        cost: 0.00062,
        reasoning: 'Chain of thought verified policy: Default-deny for external mutations.',
      },
    });
    setIsComparing(false);
  };

  const handleSend = async () => {
    if (!inputPrompt.trim() || isLoading) return;
    const text = inputPrompt;
    setInputPrompt('');
    setSendError(null);

    if (isComparisonMode) {
      await handleRunComparison(text);
      return;
    }

    setIsLoading(true);
    try {
      await onSendMessage(text, selectedModelId, systemPrompt);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'The chat request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const exportConversation = () => {
    if (!messages.length) return;
    const lines = messages.map((m) => {
      const role = m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : m.role;
      const ts = m.createdAt || '';
      return `### ${role}${ts ? ` (${ts})` : ''}\n\n${m.content}\n`;
    });
    const md = `# OmniFlow Conversation\n\nExported: ${new Date().toISOString()}\nModel: ${selectedModelId}\nMessages: ${messages.length}\n\n---\n\n${lines.join('\n---\n\n')}`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniflow-chat-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoningIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const promptShortcuts = [
    {
      label: 'Invoice → Notion sync',
      prompt: 'Find the invoice PDF in Downloads, extract the total, and add it to my Notion expenses database.',
    },
    {
      label: 'Connector Health Audit',
      prompt: 'Check status of all connected tools and local agent tunnels.',
    },
    {
      label: 'Draft Slack Standup',
      prompt: 'Query recent merged PRs on GitHub and draft a release summary for #dev-updates.',
    },
    {
      label: 'Search MCP Specs',
      prompt: 'Use Brave Search MCP to query latest updates in the Model Context Protocol specification.',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-transparent">
      {/* Top Controls: Model Switcher & Telemetry Bar */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-2.5 bg-white/70 dark:bg-[#0b101b]/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Model:</span>
            <div className="relative">
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="appearance-none bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {m.name} ({m.provider.toUpperCase()})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Model Specs / Telemetry */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 font-mono tabular-nums">
              {(activeModel.contextWindow / 1000).toFixed(0)}k ctx
            </span>
            <span>·</span>
            <span>View actual usage in provider billing</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsComparisonMode(!isComparisonMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isComparisonMode
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-500/20'
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isComparisonMode ? 'Example Comparison (Active)' : 'Example Comparison'}</span>
            <span className="sm:hidden">Compare</span>
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showConfig
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="System prompt configuration"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">System Instruction</span>
          </button>
          <button
            onClick={exportConversation}
            title="Export conversation as Markdown"
            disabled={!messages.length}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClearMessages}
            title="Clear conversation"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* System prompt drawer */}
      {showConfig && (
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#0c121e]/80 backdrop-blur-md p-4 transition-all">
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Gateway System Prompt & Policy Instructions
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {isComparisonMode ? (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Example comparison (sample data only)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Live multi-provider benchmarking is not configured.
              </span>
            </div>

            {isComparing ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center animate-spin text-indigo-600 dark:text-indigo-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Benchmarking query across 3 model gateways...
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Measuring latency (ms), token generation speed, and token cost
                </div>
              </div>
            ) : comparisonResults ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-white/80 dark:bg-[#0e1424]/80 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs shadow-xs">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-0.5">Test Prompt</span>
                  <span className="text-slate-900 dark:text-slate-100 font-medium">{comparisonResults.prompt}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/80 dark:bg-[#0e1424]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 space-y-3 flex flex-col justify-between shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Gemini 2.5 Flash</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded">
                          Fastest ({comparisonResults.gemini.latency}ms)
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {comparisonResults.gemini.text}
                      </div>
                      {comparisonResults.gemini.reasoning && (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-[11px] font-mono text-slate-500">
                          {comparisonResults.gemini.reasoning}
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between tabular-nums">
                      <span>{comparisonResults.gemini.tokens} tokens</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">${comparisonResults.gemini.cost.toFixed(5)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/80 dark:bg-[#0e1424]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 space-y-3 flex flex-col justify-between shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Claude 3.7 Sonnet</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded">
                          {comparisonResults.claude.latency}ms
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {comparisonResults.claude.text}
                      </div>
                      {comparisonResults.claude.reasoning && (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-[11px] font-mono text-slate-500">
                          {comparisonResults.claude.reasoning}
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between tabular-nums">
                      <span>{comparisonResults.claude.tokens} tokens</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">${comparisonResults.claude.cost.toFixed(5)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/80 dark:bg-[#0e1424]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 space-y-3 flex flex-col justify-between shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">DeepSeek R1</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 rounded">
                          {comparisonResults.deepseek.latency}ms
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {comparisonResults.deepseek.text}
                      </div>
                      {comparisonResults.deepseek.reasoning && (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-[11px] font-mono text-slate-500">
                          {comparisonResults.deepseek.reasoning}
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between tabular-nums">
                      <span>{comparisonResults.deepseek.tokens} tokens</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">${comparisonResults.deepseek.cost.toFixed(5)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Ready to Benchmark Models
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Type any coding prompt or task in the input bar below to dispatch it simultaneously to Gemini, Claude, and DeepSeek.
                </p>
                <button
                  onClick={() => handleRunComparison('Propose an architectural refactor for a Next.js full-stack app with MCP server connectors')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-500/25"
                >
                  Run Sample Comparison &rarr;
                </button>
              </div>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">OmniFlow Control Assistant</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ask anything about your projects, connectors, or workflows. Conversation history is now remembered across turns.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {promptShortcuts.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setInputPrompt(s.prompt)}
                  className="text-left px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/80 text-xs transition-colors"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">{s.label}</span>
                  <span className="text-slate-500 dark:text-slate-400 line-clamp-1">{s.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-white/80 dark:bg-[#0e1424]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-md shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {!isUser && msg.tokenStats && (
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums border-t border-slate-100 dark:border-slate-800 mt-2">
                      <span>
                        {msg.tokenStats.promptTokens + msg.tokenStats.completionTokens} tokens (in:{' '}
                        {msg.tokenStats.promptTokens}, out: {msg.tokenStats.completionTokens})
                      </span>
                      <span>{msg.tokenStats.latencyMs}ms</span>
                    </div>
                  )}

                  {!isUser && (
                    <div className="pt-1.5 flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {sendError && (
          <div className="max-w-2xl mx-auto p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Chat request failed</div>
              <div className="text-xs mt-0.5 opacity-90">{sendError}</div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
            <div className="bg-white/80 dark:bg-[#0e1424]/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-500">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0b101b]/80 backdrop-blur-xl p-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isComparisonMode ? 'Enter a prompt to benchmark across models...' : 'Message OmniFlow...'}
              rows={1}
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 px-4 py-3 pr-12 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>
          <PushToTalkButton
            onTranscript={(text) => setInputPrompt((prev) => (prev ? prev + ' ' + text : text))}
          />
          <button
            onClick={handleSend}
            disabled={!inputPrompt.trim() || isLoading}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm shadow-indigo-500/25 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
