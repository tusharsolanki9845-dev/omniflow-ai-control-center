import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Terminal,
  Cpu,
  ShieldCheck,
  Radio,
  FolderLock,
  Workflow,
  ScrollText,
  BarChart3,
  Sliders,
  Sparkles,
  ArrowRight,
  X,
  Play,
  FolderGit2,
  MessageSquare,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Code2,
  Keyboard,
  Download,
  Rocket,
  Cloud,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIProject, AuditLog, ChatMessage } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: AIProject[];
  auditLogs?: AuditLog[];
  messages?: ChatMessage[];
  onNavigate: (tab: string) => void;
  onRunScenario: (prompt: string) => void;
  onOpenShortcuts?: () => void;
  onOpenNetlifyDeploy?: () => void;
  onOpenVercelDeploy?: () => void;
  onOpenGoogleDrive?: () => void;
}

type SearchCategory = 'all' | 'projects' | 'audit' | 'chat' | 'commands';

interface SearchResultItem {
  id: string;
  category: 'project' | 'audit' | 'chat' | 'nav' | 'workflow';
  categoryLabel: string;
  title: string;
  subtitle: string;
  snippet?: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  projects = [],
  auditLogs = [],
  messages = [],
  onNavigate,
  onRunScenario,
  onOpenShortcuts,
  onOpenNetlifyDeploy,
  onOpenVercelDeploy,
  onOpenGoogleDrive,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Focus input on open and reset state
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveFilter('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Keyboard listener for shortcut closing and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Quick navigation items
  const quickNav = useMemo(
    () => [
      {
        id: 'nav-projects',
        tab: 'projects',
        label: 'Portfolio & AI Hub (Tushar Solanki)',
        desc: 'Manage live Vercel portfolio, GitHub repos, and Cursor/v0 AI builds',
        icon: FolderGit2,
      },
      {
        id: 'nav-actions',
        tab: 'actions',
        label: 'Universal Action Console',
        desc: 'Natural language intent decomposition into atomic tool executions',
        icon: Terminal,
      },
      {
        id: 'nav-chat',
        tab: 'chat',
        label: 'Model Gateway & Switcher',
        desc: 'Query Gemini 3.8 Flash, Claude 3.7 Sonnet, DeepSeek R1, or local models',
        icon: Cpu,
      },
      {
        id: 'nav-approvals',
        tab: 'approvals',
        label: 'Approval Queue (Review Guardrails)',
        desc: 'Verify external state writes, GitHub commits, and email dispatches',
        icon: ShieldCheck,
      },
      {
        id: 'nav-connectors',
        tab: 'connectors',
        label: 'Tool Connectors & MCP Registry',
        desc: 'Standardize access to cloud APIs and Model Context Protocol servers',
        icon: Radio,
      },
      {
        id: 'nav-files',
        tab: 'files',
        label: 'Workstation Local Agent & Files',
        desc: 'Inspect sandboxed directories, allowed commands, and extracted tokens',
        icon: FolderLock,
      },
      {
        id: 'nav-automations',
        tab: 'automations',
        label: 'Automations & Pipelines',
        desc: 'Recurring scheduled background jobs, cron triggers, and pipelines',
        icon: Workflow,
      },
      {
        id: 'nav-audit',
        tab: 'audit',
        label: 'Security Audit Ledger',
        desc: 'Tamper-evident cryptographic SHA-256 event trail and exports',
        icon: ScrollText,
      },
      {
        id: 'cmd-export-audit',
        tab: 'audit',
        label: 'Export Audit Ledger (CSV / JSON / JSONL)',
        desc: 'Download compliance history, CSV spreadsheet, or NDJSON logs for external analysis',
        icon: Download,
      },
      {
        id: 'nav-usage',
        tab: 'usage',
        label: 'Usage & Cost Analytics',
        desc: 'Real-time token consumption, latency benchmarks, and budget caps',
        icon: BarChart3,
      },
    ],
    []
  );

  // Quick action workflow presets
  const quickWorkflows = useMemo(
    () => [
      {
        id: 'wf-portfolio',
        title: '⚡ Turbo Audit Portfolio & Sync to GitHub',
        prompt:
          'Audit tushar-portfolio-live.vercel.app, verify Vercel SSL and Schema.org Person JSON-LD, extract recent AI builds, and stage commit to tusharsolanki9845-dev/tushar-portfolio-vercel.',
      },
      {
        id: 'wf-hunter',
        title: '🚀 Complete Outreach Engine in Webclient Hunter AI',
        prompt:
          'Audit Webclient Hunter AI repository, implement automated personalized outreach generator with sub-second latency, and stage GitHub PR with unit tests.',
      },
      {
        id: 'wf-invoice',
        title: '📑 Parse Invoice PDF in Downloads → Notion Expenses',
        prompt:
          'Find the invoice PDF in Downloads, extract the total, and add it to my Notion expenses database.',
      },
      {
        id: 'wf-scan',
        title: '🔍 Scan Cursor & v0 Repos for Unfinished Tasks',
        prompt:
          'Inspect active projects across Cursor and v0.dev, extract incomplete milestones, and prioritize next sprint tasks with risk badges.',
      },
    ],
    []
  );

  // Full-Text Indexed Results across Projects, Audit Logs, Chat Messages, and Commands
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // Helper to test if item matches query
    const matches = (fields: (string | undefined | null)[]) => {
      if (!q) return true;
      return fields.some((f) => f && f.toLowerCase().includes(q));
    };

    // 1. Index Projects
    projects.forEach((proj) => {
      const taskTitles = proj.pendingTasks.map((t) => t.title).join(' ');
      const tech = proj.techStack.join(' ');
      if (matches([proj.name, proj.repoName, proj.description, proj.nextAction, taskTitles, tech, proj.aiToolOrigin])) {
        // Highlight task match if query matched a task
        const matchedTask = proj.pendingTasks.find((t) => t.title.toLowerCase().includes(q));
        const snippetText = matchedTask
          ? `Milestone: ${matchedTask.title}`
          : proj.description;

        results.push({
          id: `proj-${proj.id}`,
          category: 'project',
          categoryLabel: 'AI Project',
          title: proj.name,
          subtitle: `${proj.repoName} · ${proj.completionPct}% complete · ${proj.aiToolOrigin.toUpperCase()}`,
          snippet: snippetText,
          badge: `${proj.completionPct}%`,
          badgeColor: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400',
          icon: FolderGit2,
          action: () => {
            onNavigate('projects');
            onClose();
          },
        });
      }
    });

    // 2. Index Audit Logs
    auditLogs.forEach((log) => {
      if (
        matches([
          log.tool,
          log.event,
          log.provider,
          log.modelUsed,
          log.argumentsDigest,
          log.payloadHash,
          log.status,
          log.user,
        ])
      ) {
        results.push({
          id: `audit-${log.id}`,
          category: 'audit',
          categoryLabel: 'Audit Log',
          title: `${log.tool} (${log.event})`,
          subtitle: `${log.provider.toUpperCase()} · ${log.modelUsed} · ${log.timestamp} · sha256:${log.payloadHash}`,
          snippet: log.argumentsDigest,
          badge: log.status,
          badgeColor:
            log.status === 'SUCCESS' || log.status === 'APPROVED'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
              : log.status === 'PENDING'
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400',
          icon: ScrollText,
          action: () => {
            onNavigate('audit');
            onClose();
          },
        });
      }
    });

    // 3. Index Chat Messages (Past conversations & reasoning)
    messages.forEach((msg) => {
      const toolText = msg.toolCalls ? msg.toolCalls.map((t) => t.toolName).join(' ') : '';
      if (matches([msg.content, msg.reasoning, toolText, msg.modelId, msg.role])) {
        const isUser = msg.role === 'user';
        const truncatedContent =
          msg.content.length > 120 ? msg.content.substring(0, 120) + '...' : msg.content;
        results.push({
          id: `chat-${msg.id}`,
          category: 'chat',
          categoryLabel: 'Chat History',
          title: isUser ? 'User Message' : `Assistant (${msg.modelId || 'Gateway LLM'})`,
          subtitle: `${msg.createdAt} ${msg.tokenStats ? `· ${msg.tokenStats.latencyMs}ms` : ''}`,
          snippet: truncatedContent,
          badge: isUser ? 'Prompt' : 'Response',
          badgeColor: isUser
            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
            : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400',
          icon: MessageSquare,
          action: () => {
            onNavigate('chat');
            onClose();
          },
        });
      }
    });

    // 4. Index Navigation
    quickNav.forEach((item) => {
      if (matches([item.label, item.desc, item.tab])) {
        results.push({
          id: item.id,
          category: 'nav',
          categoryLabel: 'Workspace',
          title: item.label,
          subtitle: item.desc,
          icon: item.icon,
          action: () => {
            onNavigate(item.tab);
            onClose();
          },
        });
      }
    });

    // 5. Index Workflows
    quickWorkflows.forEach((wf) => {
      if (matches([wf.title, wf.prompt])) {
        results.push({
          id: wf.id,
          category: 'workflow',
          categoryLabel: 'Workflow',
          title: wf.title,
          subtitle: wf.prompt,
          icon: Play,
          action: () => {
            onRunScenario(wf.prompt);
            onNavigate('actions');
            onClose();
          },
        });
      }
    });

    // 6. Direct Deployment Commands
    if (onOpenNetlifyDeploy && matches(['deploy', 'live', 'netlify', 'nestify', 'cloud', 'hosting'])) {
      results.push({
        id: 'cmd-deploy-netlify',
        category: 'nav',
        categoryLabel: 'Deployment',
        title: 'Deploy Live to Netlify / Nestify (omniflow.netlify.app)',
        subtitle: '1-click token deploy, 1-click web console, Nestify.io cluster, or CLI push',
        badge: 'Edge Live',
        badgeColor: 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300',
        icon: Rocket,
        action: () => {
          onClose();
          onOpenNetlifyDeploy();
        },
      });
    }

    if (onOpenVercelDeploy && matches(['deploy', 'live', 'vercel', 'portfolio', 'production'])) {
      results.push({
        id: 'cmd-deploy-vercel',
        category: 'nav',
        categoryLabel: 'Deployment',
        title: 'Deploy Live to Vercel (tushar-portfolio-live.vercel.app)',
        subtitle: 'Deploy current production build to Vercel Edge with zero-downtime',
        badge: 'Vercel Live',
        badgeColor: 'bg-black dark:bg-slate-800 text-white',
        icon: Rocket,
        action: () => {
          onClose();
          onOpenVercelDeploy();
        },
      });
    }

    // 7. Google Drive Backup Command
    if (onOpenGoogleDrive && matches(['google drive', 'drive', 'upload', 'backup', 'export drive', 'google', 'cloud backup', 'drive v3'])) {
      results.push({
        id: 'cmd-google-drive',
        category: 'nav',
        categoryLabel: 'Google Workspace',
        title: 'Upload Project to Google Drive',
        subtitle: 'Backup complete source files, config, and audit ledger to Google Drive',
        badge: 'Drive v3',
        badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
        icon: Cloud,
        action: () => {
          onClose();
          onOpenGoogleDrive();
        },
      });
    }

    return results;
  }, [
    query,
    projects,
    auditLogs,
    messages,
    quickNav,
    quickWorkflows,
    onNavigate,
    onRunScenario,
    onClose,
    onOpenNetlifyDeploy,
    onOpenVercelDeploy,
    onOpenGoogleDrive,
  ]);

  // Filter results by active tab
  const filteredResults = useMemo(() => {
    if (activeFilter === 'all') return searchResults;
    if (activeFilter === 'projects') return searchResults.filter((r) => r.category === 'project');
    if (activeFilter === 'audit') return searchResults.filter((r) => r.category === 'audit');
    if (activeFilter === 'chat') return searchResults.filter((r) => r.category === 'chat');
    if (activeFilter === 'commands')
      return searchResults.filter((r) => r.category === 'nav' || r.category === 'workflow');
    return searchResults;
  }, [searchResults, activeFilter]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      all: searchResults.length,
      projects: searchResults.filter((r) => r.category === 'project').length,
      audit: searchResults.filter((r) => r.category === 'audit').length,
      chat: searchResults.filter((r) => r.category === 'chat').length,
      commands: searchResults.filter((r) => r.category === 'nav' || r.category === 'workflow').length,
    };
  }, [searchResults]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        filteredResults[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-20 p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search across projects, audit logs, chat messages, or commands..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-400 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Category Filters Bar */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center gap-1 overflow-x-auto text-xs shrink-0 select-none">
          <button
            onClick={() => {
              setActiveFilter('all');
              setSelectedIndex(0);
            }}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-700 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-75 font-mono tabular-nums">({counts.all})</span>
          </button>
          <button
            onClick={() => {
              setActiveFilter('projects');
              setSelectedIndex(0);
            }}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'projects'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Projects</span>
            <span className="text-[10px] opacity-75 font-mono tabular-nums">({counts.projects})</span>
          </button>
          <button
            onClick={() => {
              setActiveFilter('audit');
              setSelectedIndex(0);
            }}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'audit'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
            <span className="text-[10px] opacity-75 font-mono tabular-nums">({counts.audit})</span>
          </button>
          <button
            onClick={() => {
              setActiveFilter('chat');
              setSelectedIndex(0);
            }}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'chat'
                ? 'bg-purple-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Messages</span>
            <span className="text-[10px] opacity-75 font-mono tabular-nums">({counts.chat})</span>
          </button>
          <button
            onClick={() => {
              setActiveFilter('commands');
              setSelectedIndex(0);
            }}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'commands'
                ? 'bg-slate-900 dark:bg-slate-700 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Commands & Workflows</span>
            <span className="text-[10px] opacity-75 font-mono tabular-nums">({counts.commands})</span>
          </button>
        </div>

        {/* Results List */}
        <div ref={resultsContainerRef} className="p-2 sm:p-3 overflow-y-auto space-y-1 text-xs flex-1">
          {filteredResults.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                No matching results found for "{query}"
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try searching for repository names (e.g. <code>hunter</code>, <code>portfolio</code>), tools, or audit hashes.
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        item.category === 'project'
                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                          : item.category === 'audit'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : item.category === 'chat'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.categoryLabel}
                        </span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-mono rounded font-semibold ${
                              item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        {item.subtitle}
                      </div>

                      {item.snippet && (
                        <div className="p-2 rounded-md bg-white/70 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono leading-relaxed line-clamp-2">
                          {item.snippet}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 shrink-0 self-center">
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">
                      ↵ Enter
                    </kbd>
                    <ArrowRight className="w-4 h-4 text-indigo-500" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500 shrink-0 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">↵</kbd> Select
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">ESC</kbd> Close
            </span>
          </div>

          <span className="hidden sm:inline">
            OmniFlow Full-Text Index · {searchResults.length} total records
          </span>
        </div>
      </motion.div>
    </div>
  );
};
