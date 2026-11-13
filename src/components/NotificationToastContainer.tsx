import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem } from '../types';

interface NotificationToastContainerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onApproveAction?: (actionId: string) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  notifications,
  onDismiss,
  onNavigateTab,
  onApproveAction,
}) => {
  // Only display notifications created in the last 15 seconds that are unread
  const [activeToasts, setActiveToasts] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const recent = notifications
      .filter((n) => {
        if (n.read) return false;
        const ageMs = Date.now() - new Date(n.timestamp).getTime();
        return ageMs < 12000; // Last 12 seconds
      })
      .slice(0, 3); // Max 3 visible toasts simultaneously

    setActiveToasts(recent);
  }, [notifications]);

  if (!activeToasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-16 md:bottom-5 right-3 md:right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      <AnimatePresence>
        {activeToasts.map((toast) => {
          const isUrgentApproval = toast.type === 'APPROVAL_REQUIRED';
          const isFailed = toast.type === 'TASK_FAILED';
          const isCompleted = toast.type === 'TASK_COMPLETED';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all ${
                isUrgentApproval
                  ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-100 shadow-amber-500/10'
                  : isFailed
                  ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700/80 text-rose-950 dark:text-rose-100 shadow-rose-500/10'
                  : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700/80 text-emerald-950 dark:text-emerald-100 shadow-emerald-500/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                      isUrgentApproval
                        ? 'bg-amber-500 text-white animate-pulse'
                        : isFailed
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isUrgentApproval && <AlertTriangle className="w-4 h-4" />}
                    {isFailed && <AlertOctagon className="w-4 h-4" />}
                    {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm tracking-tight truncate">
                        {toast.title}
                      </span>
                      {isUrgentApproval && (
                        <span className="text-[9px] font-mono font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-full uppercase">
                          Action Required
                        </span>
                      )}
                      {isFailed && (
                        <span className="text-[9px] font-mono font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                          Failed
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90 line-clamp-2">
                      {toast.message}
                    </p>
                    {toast.errorDetails && (
                      <p className="text-[10px] font-mono text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-900/40 p-1.5 rounded-lg truncate mt-1">
                        {toast.errorDetails}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDismiss(toast.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                  aria-label="Dismiss toast"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toast Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2.5 mt-2 border-t border-black/5 dark:border-white/5">
                {isUrgentApproval && onApproveAction && toast.relatedEntityId && (
                  <button
                    onClick={() => {
                      onApproveAction(toast.relatedEntityId!);
                      onDismiss(toast.id);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Approve 1-Click</span>
                  </button>
                )}

                {toast.actionTab && (
                  <button
                    onClick={() => {
                      onNavigateTab(toast.actionTab!);
                      onDismiss(toast.id);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                      isUrgentApproval
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : isFailed
                        ? 'bg-rose-700 hover:bg-rose-600 text-white'
                        : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    <span>{toast.actionLabel || 'Inspect'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
