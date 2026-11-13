import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Check,
  Trash2,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  Filter,
  ShieldAlert,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onNavigateTab: (tab: string) => void;
  onApproveAction?: (actionId: string) => void;
  onSimulateCompleted: () => void;
  onSimulateFailed: () => void;
  onSimulateUrgentApproval: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  soundEnabled,
  onToggleSound,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
  onNavigateTab,
  onApproveAction,
  onSimulateCompleted,
  onSimulateFailed,
  onSimulateUrgentApproval,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'approvals' | 'failed' | 'completed'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const approvalsCount = notifications.filter((n) => n.type === 'APPROVAL_REQUIRED').length;
  const failedCount = notifications.filter((n) => n.type === 'TASK_FAILED').length;
  const completedCount = notifications.filter((n) => n.type === 'TASK_COMPLETED').length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'approvals') return n.type === 'APPROVAL_REQUIRED';
    if (filter === 'failed') return n.type === 'TASK_FAILED';
    if (filter === 'completed') return n.type === 'TASK_COMPLETED';
    return true;
  });

  const formatRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 30) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Global Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Live alerts for completed tasks, failures & manual approvals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                soundEnabled
                  ? 'border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Simulation Controls */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Simulate Live Automated Events</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Instant test</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <button
              onClick={onSimulateCompleted}
              className="px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="truncate">Task Done</span>
            </button>
            <button
              onClick={onSimulateFailed}
              className="px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
              <span className="truncate">Task Failed</span>
            </button>
            <button
              onClick={onSimulateUrgentApproval}
              className="px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">Need Approval</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Batch Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] font-medium flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('approvals')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                filter === 'approvals'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Approvals ({approvalsCount})</span>
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                filter === 'failed'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Failed ({failedCount})</span>
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                filter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Completed ({completedCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-xs font-medium text-slate-500">No notifications in this view.</p>
              <p className="text-[11px] text-slate-400">
                Automated tasks, errors, and approvals will report here in real-time.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUrgent = notif.type === 'APPROVAL_REQUIRED';
              const isFailed = notif.type === 'TASK_FAILED';
              const isCompleted = notif.type === 'TASK_COMPLETED';

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                    !notif.read
                      ? isUrgent
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 shadow-2xs'
                        : isFailed
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 shadow-2xs'
                        : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 shadow-2xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          isUrgent
                            ? 'bg-amber-500 text-white'
                            : isFailed
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isUrgent && <AlertTriangle className="w-3.5 h-3.5" />}
                        {isFailed && <AlertOctagon className="w-3.5 h-3.5" />}
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          )}
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatRelativeTime(notif.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {notif.message}
                        </p>

                        {notif.errorDetails && (
                          <div className="p-2 rounded-lg bg-rose-100/60 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-[10px] font-mono text-rose-800 dark:text-rose-200">
                            {notif.errorDetails}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.read && (
                        <button
                          onClick={() => onMarkAsRead(notif.id)}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDismiss(notif.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                        title="Delete notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {isUrgent ? 'Priority: Urgent' : isFailed ? 'Priority: High' : 'Priority: Normal'}
                    </span>

                    <div className="flex items-center gap-2">
                      {isUrgent && onApproveAction && notif.relatedEntityId && (
                        <button
                          onClick={() => {
                            onApproveAction(notif.relatedEntityId!);
                            onMarkAsRead(notif.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve 1-Click</span>
                        </button>
                      )}

                      {notif.actionTab && (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateTab(notif.actionTab!);
                            onMarkAsRead(notif.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors flex items-center gap-1"
                        >
                          <span>{notif.actionLabel || 'Inspect'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            OmniFlow Autonomous Event Gateway
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
