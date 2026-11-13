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
                  {/* Gemini 2.5 Flash */}
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

                  {/* Claude 3.7 Sonnet */}
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

                  {/* DeepSeek R1 */}
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
          <div className="max-w-xl mx-auto py-12 sm:py-16 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Unified AI Model Gateway
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Route requests to Gemini 2.5 Flash, Claude 3.7, or local models. All tool interactions are validated by security connectors.
              </p>
            </div>

            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {promptShortcuts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputPrompt(item.prompt)}
                  className="p-3 text-xs bg-white/70 dark:bg-[#0c121e]/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-slate-700 dark:text-slate-300 group hover:shadow-sm"
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {item.prompt}
                  </div>
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
                className={`flex gap-3 sm:gap-4 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shrink-0 flex items-center justify-center font-bold text-xs shadow-sm shadow-indigo-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`space-y-3 max-w-[88%] sm:max-w-[80%] ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-md shadow-indigo-500/10'
                      : 'bg-white/85 dark:bg-[#0d1424]/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {/* Assistant Header */}
                  {!isUser && (
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {models.find((m) => m.id === msg.modelId)?.name || 'Gateway LLM'}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums">{msg.createdAt}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Deep Reasoning Box */}
                  {!isUser && msg.reasoning && (
                    <div className="rounded-xl bg-slate-50/80 dark:bg-[#070c16]/70 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden text-xs">
                      <button
                        onClick={() => toggleReasoning(msg.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-indigo-500" />
                          Model Reasoning & Guardrail Trace
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            expandedReasoningIds[msg.id] ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {expandedReasoningIds[msg.id] && (
                        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed bg-white/40 dark:bg-slate-950/40">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main text content */}
                  <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* Tool Call Invocation Cards */}
                  {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        Standardized Tool Calls ({msg.toolCalls.length})
                      </div>
                      {msg.toolCalls.map((tc) => (
                        <div
                          key={tc.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs font-mono space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {tc.toolName}
                            </span>
                            {tc.status === 'success' && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Executed (Safe)
                              </span>
                            )}
                            {tc.status === 'requires_approval' && (
                              <button
                                onClick={onOpenApprovals}
                                className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-sans font-semibold hover:underline"
                              >
                                <AlertTriangle className="w-3 h-3" /> Queued for Approval &rarr;
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200/70 dark:border-slate-800 overflow-x-auto">
                            args: {JSON.stringify(tc.args)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Token & Latency Meter */}
                  {!isUser && msg.tokenStats && (
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums border-t border-slate-100 dark:border-slate-800">
                      <span>
                        {msg.tokenStats.promptTokens + msg.tokenStats.completionTokens} tokens (in:{' '}
                        {msg.tokenStats.promptTokens}, out: {msg.tokenStats.completionTokens})
                      </span>
                      <span>
                        {msg.tokenStats.latencyMs}ms
                        {msg.tokenStats.totalCost !== undefined &&
                          ` · $${msg.tokenStats.totalCost.toFixed(5)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Composer */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 bg-white/80 dark:bg-[#090d16]/85 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-2">
          {sendError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{sendError}</span>
            </div>
          )}
          {/* Quick shortcuts */}
          <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-slate-400 shrink-0 font-medium">Quick prompts:</span>
            {promptShortcuts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setInputPrompt(s.prompt)}
                className="px-2.5 py-1 text-[11px] bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-lg whitespace-nowrap transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Ask ${activeModel.name} to orchestrate tools, inspect files, or query APIs... (or hold mic)`}
                rows={2}
                className="w-full text-xs sm:text-[13px] bg-slate-100/70 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Push-to-Talk Speech-to-Text Button */}
            <PushToTalkButton
              disabled={isLoading}
              onTranscript={(transcript) => {
                setInputPrompt(transcript);
              }}
              onAutoSend={async (transcript) => {
                if (!transcript.trim() || isLoading) return;
                setIsLoading(true);
                try {
                  await onSendMessage(transcript, selectedModelId, systemPrompt);
                  setSendError(null);
                } catch (error) {
                  setSendError(error instanceof Error ? error.message : 'The chat request failed.');
                } finally {
                  setIsLoading(false);
                }
              }}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-indigo-500/20 shrink-0 h-10"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
