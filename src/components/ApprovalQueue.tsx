import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Filter,
  Check,
  X,
  FileText,
  Mail,
  MessageSquare,
  HardDrive,
  CheckSquare,
  Square,
  MinusSquare,
  Search,
  Sparkles,
  Zap,
  RotateCcw,
  ListFilter,
  ChevronRight,
} from 'lucide-react';
import { Action, RiskLevel } from '../types';

interface ApprovalQueueProps {
  actions: Action[];
  onApprove: (actionId: string) => void;
  onReject: (actionId: string, feedback?: string) => void;
  onBatchApprove?: (actionIds: string[]) => void;
  onBatchReject?: (actionIds: string[], feedback?: string) => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  actions,
  onApprove,
  onReject,
  onBatchApprove,
  onBatchReject,
}) => {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'elevated' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Single reject modal
  const [rejectModalActionId, setRejectModalActionId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState<string>('');

  // Batch modal state
  const [isBatchApproveModalOpen, setIsBatchApproveModalOpen] = useState<boolean>(false);
  const [isBatchRejectModalOpen, setIsBatchRejectModalOpen] = useState<boolean>(false);
  const [batchFeedback, setBatchFeedback] = useState<string>('');
  const [lastBatchMessage, setLastBatchMessage] = useState<string | null>(null);

  const pendingActions = useMemo(
    () => actions.filter((a) => a.status === 'pending_approval'),
    [actions]
  );

  // Filtered actions based on tab, risk, and search query
  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      // Status filter
      if (filter === 'pending' && a.status !== 'pending_approval') return false;
      if (filter === 'approved' && a.status !== 'approved') return false;
      if (filter === 'rejected' && a.status !== 'rejected') return false;

      // Risk filter
      if (riskFilter !== 'all' && a.riskLevel !== riskFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTool = a.toolName.toLowerCase().includes(q);
        const matchesIntent = a.promptIntent.toLowerCase().includes(q);
        const matchesResource = a.targetResource.toLowerCase().includes(q);
        const matchesProvider = a.provider.toLowerCase().includes(q);
        if (!matchesTool && !matchesIntent && !matchesResource && !matchesProvider) {
          return false;
        }
      }

      return true;
    });
  }, [actions, filter, riskFilter, searchQuery]);

  // Available selectable items (only pending can be approved/rejected)
  const selectablePendingInView = useMemo(() => {
    return filteredActions.filter((a) => a.status === 'pending_approval');
  }, [filteredActions]);

  // Clear selections when switching tab or when items are no longer pending
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        const item = actions.find((a) => a.id === id);
        if (item && item.status === 'pending_approval') {
          next.add(id);
        }
      });
      return next;
    });
  }, [actions]);

  // Global keyboard shortcuts: Esc to clear selection, Cmd+A to select all pending
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIds.size > 0) {
        setSelectedIds(new Set());
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && filter === 'pending') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleSelectAll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, selectablePendingInView, filter]);

  const toggleSelectAction = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === selectablePendingInView.length && selectablePendingInView.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectablePendingInView.map((a) => a.id)));
    }
  };

  const handleSelectByRisk = (risk: RiskLevel) => {
    const matching = pendingActions.filter((a) => a.riskLevel === risk).map((a) => a.id);
    setSelectedIds(new Set(matching));
  };

  // Selected items breakdown
  const selectedActionsList = useMemo(() => {
    return actions.filter((a) => selectedIds.has(a.id));
  }, [actions, selectedIds]);

  const selectedCriticalCount = useMemo(
    () => selectedActionsList.filter((a) => a.riskLevel === 'critical').length,
    [selectedActionsList]
  );
  const selectedElevatedCount = useMemo(
    () => selectedActionsList.filter((a) => a.riskLevel === 'elevated').length,
    [selectedActionsList]
  );
  const selectedSafeCount = useMemo(
    () => selectedActionsList.filter((a) => a.riskLevel === 'safe').length,
    [selectedActionsList]
  );

  // Batch execution handlers
  const executeBatchApprove = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    if (onBatchApprove) {
      onBatchApprove(ids);
    } else {
      ids.forEach((id) => onApprove(id));
    }

    setLastBatchMessage(`Successfully approved and executed ${ids.length} action(s).`);
    setSelectedIds(new Set());
    setIsBatchApproveModalOpen(false);

    setTimeout(() => setLastBatchMessage(null), 4000);
  };

  const executeBatchReject = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    if (onBatchReject) {
      onBatchReject(ids, batchFeedback);
    } else {
      ids.forEach((id) => onReject(id, batchFeedback));
    }

    setLastBatchMessage(`Rejected ${ids.length} action proposal(s).`);
    setSelectedIds(new Set());
    setIsBatchRejectModalOpen(false);
    setBatchFeedback('');

    setTimeout(() => setLastBatchMessage(null), 4000);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'notion':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'gmail':
        return <Mail className="w-4 h-4 text-rose-500" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'local_agent':
        return <HardDrive className="w-4 h-4 text-amber-500" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-500" />;
    }
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'safe':
        return (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Safe
          </span>
        );
      case 'elevated':
        return (
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Elevated Write
          </span>
        );
      case 'critical':
        return (
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Critical (External Dispatch)
          </span>
        );
    }
  };

  const handleConfirmSingleReject = () => {
    if (!rejectModalActionId) return;
    onReject(rejectModalActionId, rejectFeedback);
    setRejectModalActionId(null);
    setRejectFeedback('');
  };

  const isAllSelected =
    selectablePendingInView.length > 0 &&
    selectedIds.size === selectablePendingInView.length;
  const isPartiallySelected =
    selectedIds.size > 0 && selectedIds.size < selectablePendingInView.length;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Security Guardrails & Governance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Action Approval Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review single or batch action proposals before dispatching state modifications to connected tools.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>Pending Review</span>
            {pendingActions.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-amber-500 text-white rounded tabular-nums">
                {pendingActions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === 'approved'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Approved History
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === 'rejected'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Logs
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {lastBatchMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{lastBatchMessage}</span>
          </div>
          <button
            onClick={() => setLastBatchMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control & Batch Selection Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by tool name, intent, resource, or provider..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Risk Level Segment */}
          <div className="flex items-center gap-1 text-xs shrink-0 overflow-x-auto">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Risk:</span>
            {(['all', 'critical', 'elevated', 'safe'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                  riskFilter === r
                    ? 'bg-slate-900 dark:bg-slate-700 text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Batch selection quick tools (when in pending tab) */}
        {filter === 'pending' && selectablePendingInView.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                ) : isPartiallySelected ? (
                  <MinusSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {isAllSelected ? 'Deselect All' : `Select All Pending (${selectablePendingInView.length})`}
                </span>
              </button>

              <button
                onClick={() => handleSelectByRisk('critical')}
                className="px-2 py-1 text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
              >
                Select Critical
              </button>
              <button
                onClick={() => handleSelectByRisk('elevated')}
                className="px-2 py-1 text-[11px] text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors"
              >
                Select Elevated
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              {selectedIds.size > 0 ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {selectedIds.size} of {selectablePendingInView.length} selected
                </span>
              ) : (
                <span>Click checkboxes to batch approve or reject</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {filteredActions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No Actions Matching Criteria
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              All agent action proposals have been reviewed or filter criteria matched 0 records.
            </p>
          </div>
        ) : (
          filteredActions.map((action) => {
            const isPending = action.status === 'pending_approval';
            const isApproved = action.status === 'approved';
            const isSelected = selectedIds.has(action.id);

            return (
              <div
                key={action.id}
                className={`p-5 rounded-xl border bg-white dark:bg-slate-900 shadow-xs space-y-4 transition-all ${
                  isSelected
                    ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-500/30'
                    : isPending
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/15 dark:bg-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header row with selection checkbox */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Checkbox for batch selection */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => toggleSelectAction(action.id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={isSelected ? 'Deselect action' : 'Select action for batch processing'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-slate-400" />
                        )}
                      </button>
                    )}

                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getProviderIcon(action.provider)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {action.toolName}
                        </span>
                        <span>·</span>
                        <span className="text-xs text-slate-500 font-mono">
                          {action.targetResource}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        {getRiskBadge(action.riskLevel)}
                        <span>·</span>
                        <span className="tabular-nums font-mono text-[11px]">{action.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge / Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => setRejectModalActionId(action.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5 text-rose-500" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => onApprove(action.id)}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Execute</span>
                        </button>
                      </>
                    ) : isApproved ? (
                      <span className="px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Executed ({action.approvedBy || 'Approved'})</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-md flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Intent summary */}
                <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 font-sans">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">User Intent: </span>
                  {action.promptIntent}
                </div>

                {/* Preview / Diff Inspector */}
                {action.diffPreview && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Proposed State Change Preview
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-1">
                        <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">
                          Current State / Before
                        </div>
                        <div className="text-rose-900 dark:text-rose-200 text-[11px] overflow-x-auto">
                          {typeof action.diffPreview.before === 'string'
                            ? action.diffPreview.before
                            : JSON.stringify(action.diffPreview.before, null, 2)}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                        <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                          Target State / After Approval
                        </div>
                        <div className="text-emerald-900 dark:text-emerald-200 text-[11px] overflow-x-auto">
                          {typeof action.diffPreview.after === 'string'
                            ? action.diffPreview.after
                            : JSON.stringify(action.diffPreview.after, null, 2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Arguments preview */}
                <details className="text-xs">
                  <summary className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer select-none">
                    View raw parameters payload ({Object.keys(action.arguments).length} fields)
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-950 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(action.arguments, null, 2)}
                  </pre>
                </details>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Batch Action Dock Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md rounded-2xl border border-indigo-500/40 p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
              {selectedIds.size}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{selectedIds.size} action(s) selected</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({selectedCriticalCount > 0 && `${selectedCriticalCount} Critical · `}
                  {selectedElevatedCount > 0 && `${selectedElevatedCount} Elevated · `}
                  {selectedSafeCount} Safe)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Atomic batch commit to execution pipeline
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setIsBatchRejectModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Batch Reject ({selectedIds.size})</span>
            </button>
            <button
              onClick={() => setIsBatchApproveModalOpen(true)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Batch Approve ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Batch Approve Confirmation Modal */}
      {isBatchApproveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Confirm Batch Action Approval
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  You are about to approve and execute <strong>{selectedIds.size} action(s)</strong> in a single atomic batch.
                </p>
              </div>
            </div>

            {/* Critical warning if any critical actions selected */}
            {selectedCriticalCount > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Warning: {selectedCriticalCount} Critical Action(s) Included</span>
                </div>
                <p className="text-[11px] text-rose-700/90 dark:text-rose-300/90">
                  Critical actions dispatch external emails or remote code mutations. Verify their parameters below.
                </p>
              </div>
            )}

            {/* List of actions to be executed */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Actions to Dispatch ({selectedActionsList.length})
              </div>
              {selectedActionsList.map((action) => (
                <div
                  key={action.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {action.toolName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono truncate">
                      &rarr; {action.targetResource}
                    </span>
                  </div>
                  <div className="shrink-0">{getRiskBadge(action.riskLevel)}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsBatchApproveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeBatchApprove}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Execute All ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Reject Confirmation Modal */}
      {isBatchRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Batch Reject {selectedIds.size} Action(s)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  These actions will be aborted and will not execute against your connected tools.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Audit Feedback Reason (Optional)
              </label>
              <textarea
                value={batchFeedback}
                onChange={(e) => setBatchFeedback(e.target.value)}
                placeholder="e.g. Aborting batch execution due to sprint priority shift or invalid parameters"
                rows={3}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsBatchRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeBatchReject}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Confirm Batch Reject ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Reject Modal */}
      {rejectModalActionId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Reject Action Proposal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This action will be aborted and prevented from modifying any external systems. You can provide feedback for the agent audit trail:
            </p>
            <textarea
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder="e.g. Total invoice amount seems incorrect, re-check line items"
              rows={3}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalActionId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSingleReject}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
