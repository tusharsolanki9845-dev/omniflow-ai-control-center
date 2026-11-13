import React, { useState } from 'react';
import {
  Workflow,
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Plus,
  ArrowRight,
  Search,
  Trash2,
  X,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Automation } from '../types';

interface AutomationsProps {
  automations: Automation[];
  onToggle: (id: string, enabled: boolean) => void;
  onTrigger: (id: string) => Promise<void>;
  onAddAutomation?: (auto: Automation) => void;
  onDeleteAutomation?: (id: string) => void;
}

export const AutomationsView: React.FC<AutomationsProps> = ({
  automations,
  onToggle,
  onTrigger,
  onAddAutomation,
  onDeleteAutomation,
}) => {
  const [search, setSearch] = useState('');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // Form state for creating a new automation
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<'cron' | 'event' | 'manual'>('cron');
  const [cronSchedule, setCronSchedule] = useState('0 9 * * 1-5');
  const [step1Title, setStep1Title] = useState('');
  const [step1Tool, setStep1Tool] = useState('github.list_pull_requests');
  const [step2Title, setStep2Title] = useState('');
  const [step2Tool, setStep2Tool] = useState('slack.post_message');

  const filtered = automations.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.steps.some((s) => s.title.toLowerCase().includes(q) || s.toolId.toLowerCase().includes(q))
    );
  });

  const handleRun = async (id: string) => {
    setRunningId(id);
    setRunError(null);
    try {
      await onTrigger(id);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : 'Automation execution is unavailable.');
    } finally {
      setRunningId(null);
    }
  };

  const handleCreateAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAuto: Automation = {
      id: `auto-${Date.now().toString(36)}`,
      name: name.trim(),
      description: description.trim() || 'Custom recurring pipeline.',
      trigger: triggerType,
      cronSchedule: triggerType === 'cron' ? cronSchedule : undefined,
      modelId: 'gemini-2.5-flash',
      steps: [
        {
          title: step1Title.trim() || 'Query upstream resources',
          toolId: step1Tool,
          promptTemplate: 'Execute step 1 query across connected gateway.',
        },
        ...(step2Title.trim()
          ? [
              {
                title: step2Title.trim(),
                toolId: step2Tool,
                promptTemplate: 'Process results and dispatch payload.',
              },
            ]
          : []),
      ],
      isEnabled: false,
      lastRun: undefined,
      lastStatus: undefined,
      totalRuns: 0,
    };

    if (onAddAutomation) {
      onAddAutomation(newAuto);
    }

    setIsCreateModalOpen(false);
    setName('');
    setDescription('');
    setStep1Title('');
    setStep2Title('');
  };

  const totalRuns = automations.reduce((sum, a) => sum + (a.totalRuns || 0), 0);
  const activeCount = automations.filter((a) => a.isEnabled).length;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Workflow className="w-4 h-4" />
            <span>Automation drafts</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Automations & Pipeline Orchestration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define workflow drafts. Scheduling and execution are not configured in this build.
          </p>
        </div>

        {onAddAutomation && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Draft</span>
          </button>
        )}
      </div>

      {runError && (
        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {runError}
        </div>
      )}

      {/* Telemetry Summary Strip */}
      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
          <span>
            Total Pipelines: <strong className="text-slate-900 dark:text-slate-100">{automations.length}</strong>
          </span>
          <span>·</span>
          <span>
            Active Schedules: <strong className="text-emerald-600 dark:text-emerald-400">{activeCount}</strong>
          </span>
          <span>·</span>
          <span>
            Cumulative Executions: <strong className="text-slate-900 dark:text-slate-100">{totalRuns}</strong>
          </span>
        </div>

        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter pipelines by name or tool..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* List of Automations */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <Workflow className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No automation drafts</h3>
            <p className="text-xs text-slate-500">Create a draft to document a workflow. It will not be scheduled or executed.</p>
          </div>
        ) : (
          filtered.map((auto) => {
            const isRunning = runningId === auto.id;
            return (
              <div
                key={auto.id}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl shadow-xs space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {auto.name}
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80">
                        {auto.trigger.toUpperCase()}: {auto.cronSchedule || 'Manual'}
                      </span>
                      {auto.lastStatus === 'waiting_approval' && (
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                          WAITING APPROVAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {auto.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button
                      onClick={() => handleRun(auto.id)}
                      disabled
                      title="Automation execution is not configured."
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : 'fill-current'}`} />
                      <span>{isRunning ? 'Running...' : 'Execution unavailable'}</span>
                    </button>

                    <label className="relative inline-flex items-center cursor-not-allowed" title="Scheduling is not configured.">
                      <input
                        type="checkbox"
                        checked={auto.isEnabled}
                        onChange={(e) => onToggle(auto.id, e.target.checked)}
                        disabled
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>

                    {onDeleteAutomation && (
                      <button
                        onClick={() => onDeleteAutomation(auto.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete automation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Step Flow Visualization */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Pipeline Steps ({auto.steps.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {auto.steps.map((st, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {i + 1}
                          </span>
                          <span className="truncate">{st.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {st.toolId}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Telemetry Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                  <span>Last executed: {auto.lastRun || 'Never'}</span>
                  <span>Total Runs: {auto.totalRuns}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Automation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Workflow className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Create Automation Pipeline</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAutomation} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Pipeline Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nightly Pull Request Review & Standup Briefing"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize pull requests from GitHub and notify Slack"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Trigger Type</label>
                  <select
                    value={triggerType}
                    onChange={(e: any) => setTriggerType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cron">Cron Schedule</option>
                    <option value="event">Event Trigger</option>
                    <option value="manual">Manual Trigger</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Schedule Expression</label>
                  <input
                    type="text"
                    value={cronSchedule}
                    onChange={(e) => setCronSchedule(e.target.value)}
                    placeholder="0 9 * * 1-5"
                    disabled={triggerType !== 'cron'}
                    className="w-full font-mono px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Step 1 Builder */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  <span>Primary Step</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={step1Title}
                    onChange={(e) => setStep1Title(e.target.value)}
                    placeholder="Step Title (e.g. Query GitHub PRs)"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                  <select
                    value={step1Tool}
                    onChange={(e) => setStep1Tool(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="github.list_pull_requests">github.list_pull_requests</option>
                    <option value="local_agent.list_files">local_agent.list_files</option>
                    <option value="brave_search.query">brave_search.query</option>
                    <option value="gmail.list_messages">gmail.list_messages</option>
                  </select>
                </div>
              </div>

              {/* Step 2 Builder (Optional) */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  <span>Follow-Up Step (Optional)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={step2Title}
                    onChange={(e) => setStep2Title(e.target.value)}
                    placeholder="Step Title (e.g. Post to Slack)"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                  <select
                    value={step2Tool}
                    onChange={(e) => setStep2Tool(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="slack.post_message">slack.post_message</option>
                    <option value="notion.create_database_page">notion.create_database_page</option>
                    <option value="github.create_commit">github.create_commit</option>
                    <option value="local_agent.write_file">local_agent.write_file</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
                >
                  Save & Activate Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
