import React, { useState, useEffect, useMemo } from 'react';
import {
  Keyboard,
  X,
  Search,
  Command,
  CornerDownLeft,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Cpu,
  FolderGit2,
  Radio,
  FileText,
  Workflow,
  BarChart3,
  Sliders,
  SunMoon,
  Smartphone,
  Mic,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ShortcutItem {
  id: string;
  title: string;
  description: string;
  keys: string[];
  category: 'navigation' | 'actions' | 'chat' | 'approvals' | 'global';
  actionName?: string;
  onExecute?: () => void;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenThemeScheduler: () => void;
  onOpenApkModal: () => void;
  onOpenCommandPalette: () => void;
  onOpenVercelDeploy?: () => void;
  onOpenNetlifyDeploy?: () => void;
  onOpenGitHubModal?: () => void;
  onOpenNotifications?: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenSettings,
  onOpenThemeScheduler,
  onOpenApkModal,
  onOpenCommandPalette,
  onOpenVercelDeploy,
  onOpenNetlifyDeploy,
  onOpenGitHubModal,
  onOpenNotifications,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'navigation' | 'chat' | 'approvals' | 'global'>('all');
  const [recentlyPressedKey, setRecentlyPressedKey] = useState<string | null>(null);

  // Close on Escape & support single-key tab switching
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Record key press for live visual feedback
      const displayKey = e.key === ' ' ? 'Space' : e.key;
      setRecentlyPressedKey(displayKey);
      const timer = setTimeout(() => setRecentlyPressedKey(null), 1200);

      // If user presses 1-9 while modal is open, navigate directly
      if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        const tabMap: Record<string, string> = {
          '1': 'projects',
          '2': 'actions',
          '3': 'chat',
          '4': 'approvals',
          '5': 'connectors',
          '6': 'files',
          '7': 'automations',
          '8': 'audit',
          '9': 'usage',
        };
        const target = tabMap[e.key];
        if (target) {
          e.preventDefault();
          onNavigateTab(target);
          onClose();
        }
      }

      return () => clearTimeout(timer);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigateTab]);

  const shortcuts: ShortcutItem[] = useMemo(
    () => [
      // Global
      {
        id: 'help-question',
        title: 'Toggle Keyboard Shortcuts',
        description: 'Open this cheatsheet from anywhere in OmniFlow',
        keys: ['?'],
        category: 'global',
      },
      {
        id: 'cmd-k',
        title: 'Command Palette & Full-Text Search',
        description: 'Instant search across projects, audit ledger, and messages',
        keys: ['⌘', 'K'],
        category: 'global',
        actionName: 'Open Palette',
        onExecute: () => {
          onClose();
          onOpenCommandPalette();
        },
      },
      {
        id: 'escape',
        title: 'Close Active Modal / Panel',
        description: 'Dismiss any open dialog, sheet, or command menu',
        keys: ['Esc'],
        category: 'global',
        actionName: 'Dismiss',
        onExecute: onClose,
      },
      {
        id: 'theme-scheduler',
        title: 'Theme & Solar Scheduler',
        description: 'Toggle auto-theme scheduler with sunrise/sunset sync',
        keys: ['T'],
        category: 'global',
        actionName: 'Theme',
        onExecute: () => {
          onClose();
          onOpenThemeScheduler();
        },
      },
      {
        id: 'settings-modal',
        title: 'Gateway & Security Settings',
        description: 'Manage LiteLLM/OpenRouter proxies, sandboxing, and budget caps',
        keys: ['S'],
        category: 'global',
        actionName: 'Settings',
        onExecute: () => {
          onClose();
          onOpenSettings();
        },
      },
      {
        id: 'apk-modal',
        title: 'Android APK & Mobile Package',
        description: 'Download release APK or install offline WebAPK to mobile',
        keys: ['A'],
        category: 'global',
        actionName: 'Android APK',
        onExecute: () => {
          onClose();
          onOpenApkModal();
        },
      },
      {
        id: 'vercel-modal',
        title: 'Deploy to Vercel',
        description: 'Open Vercel deployment wizard and continuous integration',
        keys: ['V'],
        category: 'global',
        actionName: 'Deploy Vercel',
        onExecute: () => {
          onClose();
          if (onOpenVercelDeploy) onOpenVercelDeploy();
        },
      },
      {
        id: 'netlify-modal',
        title: 'Hosting requirements',
        description: 'View Node.js and container hosting requirements',
        keys: ['L'],
        category: 'global',
        actionName: 'Deploy Netlify',
        onExecute: () => {
          onClose();
          if (onOpenNetlifyDeploy) onOpenNetlifyDeploy();
        },
      },
      {
        id: 'github-modal',
        title: 'View GitHub repository',
        description: 'Open the OmniFlow repository and source archive',
        keys: ['G'],
        category: 'global',
        actionName: 'Push GitHub',
        onExecute: () => {
          onClose();
          if (onOpenGitHubModal) onOpenGitHubModal();
        },
      },
      {
        id: 'notifications-modal',
        title: 'Global Notifications & Alerts',
        description: 'View automated task completions, failures, and urgent approvals',
        keys: ['N'],
        category: 'global',
        actionName: 'Notifications',
        onExecute: () => {
          onClose();
          if (onOpenNotifications) onOpenNotifications();
        },
      },

      // Navigation
      {
        id: 'nav-projects',
        title: 'Projects Hub & GitHub Sync',
        description: 'Switch view to AI Projects & Workstation Tracker',
        keys: ['1'],
        category: 'navigation',
        actionName: 'Go to Projects',
        onExecute: () => {
          onClose();
          onNavigateTab('projects');
        },
      },
      {
        id: 'nav-actions',
        title: 'Universal Action Console',
        description: 'Switch view to Natural Language Intent & Tool Execution',
        keys: ['2'],
        category: 'navigation',
        actionName: 'Go to Console',
        onExecute: () => {
          onClose();
          onNavigateTab('actions');
        },
      },
      {
        id: 'nav-chat',
        title: 'Model Chat Workbench',
        description: 'Switch view to Unified Multi-LLM Chat & Benchmark',
        keys: ['3'],
        category: 'navigation',
        actionName: 'Go to Chat',
        onExecute: () => {
          onClose();
          onNavigateTab('chat');
        },
      },
      {
        id: 'nav-approvals',
        title: 'Human-in-the-Loop Approval Queue',
        description: 'Switch view to Pending State-Mutating Actions',
        keys: ['4'],
        category: 'navigation',
        actionName: 'Go to Approvals',
        onExecute: () => {
          onClose();
          onNavigateTab('approvals');
        },
      },
      {
        id: 'nav-connectors',
        title: 'Tool & MCP Registry',
        description: 'Switch view to Model Context Protocol and Cloud APIs',
        keys: ['5'],
        category: 'navigation',
        actionName: 'Go to Connectors',
        onExecute: () => {
          onClose();
          onNavigateTab('connectors');
        },
      },
      {
        id: 'nav-files',
        title: 'Local Workstation Sandbox',
        description: 'Switch view to Sandboxed File Explorer & Local Daemon',
        keys: ['6'],
        category: 'navigation',
        actionName: 'Go to Files',
        onExecute: () => {
          onClose();
          onNavigateTab('files');
        },
      },
      {
        id: 'nav-automations',
        title: 'Automations & Pipelines',
        description: 'Switch view to Scheduled Autonomous Tool Workflows',
        keys: ['7'],
        category: 'navigation',
        actionName: 'Go to Automations',
        onExecute: () => {
          onClose();
          onNavigateTab('automations');
        },
      },
      {
        id: 'nav-audit',
        title: 'Cryptographic Audit Ledger & Export',
        description: 'Switch view to SHA-256 Tamper-Evident Event Log with CSV/JSON/JSONL export',
        keys: ['8'],
        category: 'navigation',
        actionName: 'Go to Audit',
        onExecute: () => {
          onClose();
          onNavigateTab('audit');
        },
      },
      {
        id: 'nav-usage',
        title: 'Usage & Cost Dashboard',
        description: 'Switch view to Token Telemetry & Gateway Analytics',
        keys: ['9'],
        category: 'navigation',
        actionName: 'Go to Analytics',
        onExecute: () => {
          onClose();
          onNavigateTab('usage');
        },
      },

      // Chat & Voice Dictation
      {
        id: 'chat-send',
        title: 'Send Message / Execute Query',
        description: 'Dispatch prompt to active model gateway',
        keys: ['Enter'],
        category: 'chat',
      },
      {
        id: 'chat-newline',
        title: 'Multi-Line Prompt Break',
        description: 'Insert newline without triggering submission',
        keys: ['Shift', 'Enter'],
        category: 'chat',
      },
      {
        id: 'chat-push-to-talk',
        title: 'Push-to-Talk Voice Dictation',
        description: 'Hold mic button or tap to dictate code prompts via STT',
        keys: ['Mic Tap'],
        category: 'chat',
      },

      // Action Console & Approvals
      {
        id: 'console-decompose',
        title: 'Decompose Intent into Action Chain',
        description: 'Map plain English intent to atomic tool steps',
        keys: ['⌘', 'Enter'],
        category: 'approvals',
      },
      {
        id: 'approvals-select-all',
        title: 'Select All Pending Actions',
        description: 'Toggle batch selection for all queued mutations',
        keys: ['Select All'],
        category: 'approvals',
      },
      {
        id: 'approvals-batch-action',
        title: 'Batch Approve / Reject Dock',
        description: 'Process multiple items simultaneously with cryptographic audit',
        keys: ['Batch Dock'],
        category: 'approvals',
      },
    ],
    [onClose, onNavigateTab, onOpenApkModal, onOpenCommandPalette, onOpenSettings, onOpenThemeScheduler]
  );

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        activeCategory === 'all' || item.category === activeCategory;

      return matchesSearch && matchesCat;
    });
  }, [shortcuts, searchQuery, activeCategory]);

  const categories = [
    { id: 'all', label: 'All Shortcuts' },
    { id: 'global', label: 'Global' },
    { id: 'navigation', label: 'Tab Navigation (1-9)' },
    { id: 'chat', label: 'Chat & Voice' },
    { id: 'approvals', label: 'Console & Approvals' },
  ] as const;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-3xl max-h-[88vh] bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-2xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/25">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>OmniFlow Keyboard Cheatsheet</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                    Press ? anytime
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Power-user navigation, rapid tab switching, voice dictation, and batch execution shortcuts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {recentlyPressedKey && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 animate-pulse">
                  <span>Key:</span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-emerald-300 dark:border-emerald-700">
                    {recentlyPressedKey}
                  </kbd>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-800/80 space-y-3 bg-white/40 dark:bg-[#0c121e]/40">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shortcuts by action, key (e.g. ⌘K, 1-9, Enter), or description..."
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium text-xs ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shortcuts List Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5">
            {filteredShortcuts.length === 0 ? (
              <div className="py-16 text-center space-y-2 text-slate-400">
                <Keyboard className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs">No shortcuts matching &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredShortcuts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#0f1524]/60 hover:bg-white dark:hover:bg-[#12192b] border border-slate-200/70 dark:border-slate-800/70 transition-all flex items-center justify-between gap-3 group shadow-2xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Keyboard Keys Badge */}
                      <div className="flex items-center gap-1">
                        {item.keys.map((k, i) => (
                          <kbd
                            key={i}
                            className="px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 border-b-2 shadow-2xs min-w-6 text-center"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>

                      {/* Optional Clickable Action trigger */}
                      {item.onExecute && (
                        <button
                          onClick={item.onExecute}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                          title={`Execute ${item.actionName || item.title}`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#0a0e18]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>
                Tip: Press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-[10px] font-mono">1</kbd> to <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-[10px] font-mono">9</kbd> directly anytime to switch tabs.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-[10px] font-mono">Esc</kbd> to exit</span>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
