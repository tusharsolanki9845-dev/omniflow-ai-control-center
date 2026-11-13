import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit3,
  Layers,
  FileText,
  Mail,
  MessageSquare,
  HardDrive,
  Search,
  Check,
  X,
  Code2,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActionPlanStep, RiskLevel } from '../types';

interface ActionConsoleProps {
  planSteps: ActionPlanStep[];
  onGeneratePlan: (prompt: string) => void;
  onExecuteStep: (stepNumber: number) => Promise<void>;
  onOpenApprovals: () => void;
}

export const UniversalActionConsole: React.FC<ActionConsoleProps> = ({
  planSteps,
  onGeneratePlan,
  onExecuteStep,
  onOpenApprovals,
}) => {
  const [prompt, setPrompt] = useState<string>(
    'Find the invoice PDF in Downloads, extract the total, and add it to my Notion expenses database.'
  );
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [activeRunningStep, setActiveRunningStep] = useState<number | null>(null);
  const [stepTimer, setStepTimer] = useState<number>(0);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true, 2: false, 3: true });
  const [editingStepNumber, setEditingStepNumber] = useState<number | null>(null);
  const [editedArgs, setEditedArgs] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showConsoleStream, setShowConsoleStream] = useState<boolean>(true);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ time: string; level: string; msg: string }>>([
    { time: '00:01:20', level: 'PLANNER', msg: 'Classified intent into 3 sequential atomic tool operations.' },
    { time: '00:01:21', level: 'SANDBOX', msg: 'Local directory ~/Downloads validated against allowlist (Low Risk).' },
    { time: '00:01:22', level: 'SECURITY', msg: 'Notion database write identified as Medium Risk -> Approval required.' },
  ]);

  // Live timer simulation while a step is executing
  useEffect(() => {
    let interval: any = null;
    if (activeRunningStep !== null) {
      setStepTimer(0);
      interval = setInterval(() => {
        setStepTimer((t) => t + 50);
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeRunningStep]);

  const sampleWorkflows = [
    {
      title: '⚡ Turbo Audit Portfolio & Sync to GitHub',
      prompt: 'Audit tushar-portfolio-live.vercel.app, verify Vercel SSL and Schema.org Person JSON-LD, extract recent AI builds, and stage commit to tusharsolanki9845-dev/tushar-portfolio-vercel.',
    },
    {
      title: '🚀 Complete Outreach Engine in Webclient Hunter AI',
      prompt: 'Audit Webclient Hunter AI repository, implement automated personalized outreach generator with sub-second latency, and stage GitHub PR with unit tests.',
    },
    {
      title: '📑 Parse Invoice PDF in Downloads → Notion Expenses',
      prompt: 'Find the invoice PDF in Downloads, extract the total, and add it to my Notion expenses database.',
    },
    {
      title: '🔍 Scan Cursor & v0 Repos for Unfinished Tasks',
      prompt: 'Inspect active projects across Cursor and v0.dev, extract incomplete milestones, and prioritize next sprint tasks with risk badges.',
    },
    {
      title: '💬 Generate Standup PR Digest for Slack',
      prompt: 'Query active merged PRs from GitHub, generate a 3-bullet sprint summary, and post to Slack #dev-updates.',
    },
  ];

  const handleExpandWithAdvancedLanguage = () => {
    const current = prompt.trim();
    if (!current) return;
    const expanded = `[DIRECTIVE: EXECUTE FAST PARALLEL AUDIT] Target: "${current}". Preconditions: Enforce sandboxed file access (Low Risk), compute SHA-256 payload digests, isolate destructive writes to the Approval Queue with Before/After preview diffs, and return typed execution telemetry under 400ms.`;
    setPrompt(expanded);
  };

  const handleRunSingleStep = async (stepNumber: number) => {
    setActiveRunningStep(stepNumber);
    const step = planSteps.find((s) => s.stepNumber === stepNumber);
    const now = new Date().toTimeString().split(' ')[0];

    setConsoleLogs((prev) => [
      ...prev,
      { time: now, level: 'DISPATCH', msg: `Invoking step #${stepNumber} [${step?.toolName || 'tool'}]...` },
    ]);

    try {
      await onExecuteStep(stepNumber);
      const afterStep = planSteps.find((s) => s.stepNumber === stepNumber);
      if (afterStep?.requiresApproval) {
        setConsoleLogs((prev) => [
          ...prev,
          {
            time: new Date().toTimeString().split(' ')[0],
            level: 'PAUSED',
            msg: `Step #${stepNumber} paused: Enqueued in Approval Queue for 1-click confirmation.`,
          },
        ]);
      } else {
        setConsoleLogs((prev) => [
          ...prev,
          {
            time: new Date().toTimeString().split(' ')[0],
            level: 'SUCCESS',
            msg: `Step #${stepNumber} completed successfully in ${(stepTimer / 1000).toFixed(2)}s.`,
          },
        ]);
      }
    } finally {
      setActiveRunningStep(null);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    try {
      for (const step of planSteps) {
        if (step.status !== 'completed' && step.status !== 'waiting_approval') {
          await handleRunSingleStep(step.stepNumber);
        }
      }
    } finally {
      setIsRunningAll(false);
    }
  };

  const toggleExpand = (stepNum: number) => {
    setExpandedSteps((prev) => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  // Convert risk level to color-coded badge: Low, Medium, High
  const renderRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'safe':
        return (
          <span
            title="Low Risk: Read-only query within sandboxed directory or search engine. Auto-executable."
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Low Risk</span>
          </span>
        );
      case 'elevated':
        return (
          <span
            title="Medium Risk: Modifies external workspace or database state. Pauses for 1-click approval."
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 whitespace-nowrap"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Medium Risk</span>
          </span>
        );
      case 'critical':
        return (
          <span
            title="High Risk: Irreversible state deletion, external email dispatch, or financial execution. Requires strict 2FA approval."
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 whitespace-nowrap"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>High Risk</span>
          </span>
        );
    }
  };

  const getProviderIcon = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('notion')) return <FileText className="w-4 h-4 text-emerald-500" />;
    if (p.includes('gmail') || p.includes('mail')) return <Mail className="w-4 h-4 text-rose-500" />;
    if (p.includes('slack')) return <MessageSquare className="w-4 h-4 text-indigo-500" />;
    if (p.includes('local') || p.includes('device')) return <HardDrive className="w-4 h-4 text-amber-500" />;
    if (p.includes('search') || p.includes('brave')) return <Search className="w-4 h-4 text-orange-500" />;
    return <Layers className="w-4 h-4 text-slate-500" />;
  };

  // Metrics calculation
  const totalSteps = planSteps.length;
  const completedSteps = planSteps.filter((s) => s.status === 'completed').length;
  const waitingApprovalSteps = planSteps.filter((s) => s.status === 'waiting_approval').length;
  const lowRiskCount = planSteps.filter((s) => s.riskLevel === 'safe').length;
  const mediumRiskCount = planSteps.filter((s) => s.riskLevel === 'elevated').length;
  const highRiskCount = planSteps.filter((s) => s.riskLevel === 'critical').length;
  const progressPct = totalSteps > 0 ? Math.round(((completedSteps + waitingApprovalSteps) / totalSteps) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header and Risk Legend */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>Universal Action Console</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Natural Language Intent to Standardized Tool Execution
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Input natural language. OmniFlow decomposes the task into atomic steps, evaluates risk policies, and routes state writes to the approval queue.
            </p>
          </div>

          {/* Color-Coded Risk Legend */}
          <div className="flex items-center gap-2 bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-2.5 rounded-xl text-[11px] font-medium shrink-0 shadow-xs">
            <span className="text-slate-400 text-[10px] uppercase font-semibold mr-1">Risk Scale:</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Low (Safe)
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Medium
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              High
            </span>
          </div>
        </div>
      </div>

      {/* Natural Language Intent Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>State Your Intent in Plain English or Advanced Syntax</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExpandWithAdvancedLanguage}
              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200 dark:border-indigo-800/80 flex items-center gap-1.5 transition-colors"
              title="Transform brief intent into high-precision declarative execution contract"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>⚡ Expand Directive</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Gemini 3.8 Flash Turbo
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="flex-1 text-xs sm:text-[13px] bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-slate-400"
            placeholder="e.g. Find the invoice PDF in Downloads, extract the total, and add it to my Notion expenses database."
          />
          <button
            onClick={() => {
              const now = new Date().toTimeString().split(' ')[0];
              setConsoleLogs((prev) => [
                ...prev,
                { time: now, level: 'PLANNER', msg: `Parsing intent: "${prompt.slice(0, 50)}..."` },
              ]);
              onGeneratePlan(prompt);
            }}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Decompose & Map Tools</span>
          </button>
        </div>

        {/* Preset chips */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">Quick Workflows:</span>
          {sampleWorkflows.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(item.prompt);
                onGeneratePlan(item.prompt);
              }}
              className="px-2.5 py-1 text-[11px] bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-lg transition-colors truncate max-w-xs"
            >
              {item.title}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Action Chain Execution Area */}
      {planSteps.length > 0 && (
        <div className="space-y-4">
          {/* Action Chain Analytics & Controls Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-slate-100 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Action Chain Pipeline
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {completedSteps}/{totalSteps} Steps Complete
                </span>
                {waitingApprovalSteps > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md">
                    {waitingApprovalSteps} Paused for Approval
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-48 sm:w-64 bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                />
              </div>
            </div>

            {/* Risk Breakdown Chips & Run All Button */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
                <span className="text-emerald-400">{lowRiskCount} Low</span>
                <span className="text-slate-600">/</span>
                <span className="text-amber-400">{mediumRiskCount} Medium</span>
                <span className="text-slate-600">/</span>
                <span className="text-rose-400">{highRiskCount} High</span>
              </div>

              <button
                onClick={handleRunAll}
                disabled={isRunningAll || activeRunningStep !== null}
                className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50 rounded-xl transition-all flex items-center gap-2 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunningAll ? 'Executing Chain...' : 'Run All Safe Steps'}</span>
              </button>
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {planSteps.map((step) => {
              const isWaiting = step.status === 'waiting_approval';
              const isCompleted = step.status === 'completed';
              const isRunning = activeRunningStep === step.stepNumber || step.status === 'running';
              const isExpanded = !!expandedSteps[step.stepNumber];
              const isEditing = editingStepNumber === step.stepNumber;

              return (
                <motion.div
                  key={step.stepNumber}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isWaiting
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/60'
                      : isRunning
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/20'
                      : 'bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border-slate-200/80 dark:border-slate-800/80'
                  }`}
                >
                  {/* Step Header Bar */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {/* Step Number & Status Indicator */}
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isWaiting
                            ? 'bg-amber-500 text-white shadow-xs'
                            : isRunning
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isRunning ? (
                          <Clock className="w-4 h-4 animate-spin" />
                        ) : isWaiting ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          step.stepNumber
                        )}
                      </div>

                      {/* Step Title, Provider, and Tool Call */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {step.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1.5 font-medium">
                            {getProviderIcon(step.connectionProvider)}
                            <span>{step.connectionProvider.toUpperCase()}</span>
                          </span>
                          <span>·</span>
                          <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                            {step.toolName}
                          </span>
                          <span>·</span>
                          {/* Prominent Color-Coded Risk Badge */}
                          {renderRiskBadge(step.riskLevel)}
                        </div>
                      </div>
                    </div>

                    {/* Step Action Buttons & Controls */}
                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      {isCompleted && (
                        <span className="px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Executed (Safe)</span>
                        </span>
                      )}

                      {isWaiting && (
                        <button
                          onClick={onOpenApprovals}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs animate-pulse"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Review in Approvals &rarr;</span>
                        </button>
                      )}

                      {step.status === 'pending' && (
                        <button
                          onClick={() => handleRunSingleStep(step.stepNumber)}
                          disabled={isRunning || isRunningAll}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          {isRunning ? (
                            <>
                              <Clock className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                              <span className="font-mono">{(stepTimer / 1000).toFixed(1)}s</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Execute Step</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => toggleExpand(step.stepNumber)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={isExpanded ? 'Collapse parameters' : 'Expand parameters'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Parameters & Execution Details Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#080d17]/70 p-4 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                            <Code2 className="w-3.5 h-3.5" />
                            Tool Call Arguments Payload
                          </span>
                          <button
                            onClick={() => {
                              if (isEditing) {
                                try {
                                  step.arguments = JSON.parse(editedArgs);
                                  setEditingStepNumber(null);
                                  setJsonError(null);
                                } catch (e: any) {
                                  setJsonError('Invalid JSON: ' + (e?.message || 'Syntax error'));
                                }
                              } else {
                                setEditingStepNumber(step.stepNumber);
                                setEditedArgs(JSON.stringify(step.arguments, null, 2));
                                setJsonError(null);
                              }
                            }}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-sans"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isEditing ? 'Save JSON Changes' : 'Edit Parameters'}</span>
                          </button>
                        </div>

                        {isEditing ? (
                          <div className="space-y-1.5">
                            <textarea
                              value={editedArgs}
                              onChange={(e) => {
                                setEditedArgs(e.target.value);
                                if (jsonError) setJsonError(null);
                              }}
                              rows={4}
                              className="w-full text-xs font-mono bg-slate-950 text-slate-200 p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {jsonError && (
                              <div className="p-2 bg-rose-950/60 text-rose-300 border border-rose-800 text-[11px] rounded-lg font-mono">
                                {jsonError}
                              </div>
                            )}
                          </div>
                        ) : (
                          <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto">
                            {JSON.stringify(step.arguments, null, 2)}
                          </pre>
                        )}

                        {step.result && (
                          <div className="space-y-1 pt-1">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Standardized Output Result
                            </span>
                            <pre className="p-3 bg-slate-950 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto">
                              {JSON.stringify(step.result, null, 2)}
                            </pre>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gateway Live Event Stream / Terminal */}
      <div className="rounded-2xl bg-[#090d16] border border-slate-800/90 overflow-hidden shadow-md text-xs font-mono">
        <div className="px-4 py-2.5 bg-[#0f1422] border-b border-slate-800/80 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2.5">
            {/* macOS micro-dots */}
            <div className="flex items-center gap-1.5 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200 text-xs font-sans">
              Gateway Dispatch Stream
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <button
            onClick={() => setShowConsoleStream(!showConsoleStream)}
            className="text-[11px] text-slate-400 hover:text-slate-200 font-sans"
          >
            {showConsoleStream ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {showConsoleStream && (
          <div className="p-4 space-y-1.5 max-h-48 overflow-y-auto text-[11px] text-slate-300">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 tabular-nums shrink-0">[{log.time}]</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                    log.level === 'SECURITY' || log.level === 'PAUSED'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/70'
                      : log.level === 'SUCCESS'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/70'
                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/70'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-slate-300 break-all">{log.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
