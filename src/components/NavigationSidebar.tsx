import React from 'react';
import {
  Cpu,
  Terminal,
  ShieldCheck,
  FolderLock,
  Workflow,
  ScrollText,
  BarChart3,
  Sliders,
  Radio,
  CheckCircle2,
  HardDrive,
  FolderGit2,
  User,
  Github,
  X,
  Smartphone,
  Download,
  Keyboard,
  Bell,
  Cloud,
} from 'lucide-react';
import { Connection, LocalDeviceAgentConfig } from '../types';
import { SystemResourceWidget } from './SystemResourceWidget';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
  connections: Connection[];
  localAgent: LocalDeviceAgentConfig;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenSettings: () => void;
  onOpenApkModal?: () => void;
  onOpenShortcuts?: () => void;
  onOpenGitHubUpload?: () => void;
  onOpenVercelDeploy?: () => void;
  onOpenNetlifyDeploy?: () => void;
  onOpenGoogleDrive?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const NavigationSidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  connections,
  localAgent,
  isOpenMobile = false,
  onCloseMobile,
  onOpenSettings,
  onOpenApkModal,
  onOpenShortcuts,
  onOpenGitHubUpload,
  onOpenVercelDeploy,
  onOpenNetlifyDeploy,
  onOpenGoogleDrive,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const activeConnectorsCount = connections.filter((c) => c.status === 'connected').length;

  const navItems = [
    { id: 'projects', label: 'Portfolio & AI Hub', icon: FolderGit2, badge: '5 Repos' },
    { id: 'actions', label: 'Universal Console', icon: Terminal, badge: null },
    { id: 'chat', label: 'Model Gateway', icon: Cpu, badge: null },
    {
      id: 'approvals',
      label: 'Approval Queue',
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      isAlert: true,
    },
    {
      id: 'connectors',
      label: 'Connectors & MCP',
      icon: Radio,
      badge: `${activeConnectorsCount}/${connections.length}`,
    },
    { id: 'files', label: 'Local Agent & Files', icon: FolderLock, badge: null },
    { id: 'automations', label: 'Automations', icon: Workflow, badge: null },
    { id: 'audit', label: 'Audit Ledger', icon: ScrollText, badge: null },
    { id: 'usage', label: 'Usage & Spend', icon: BarChart3, badge: null },
    { id: 'settings', label: 'Gateway Settings', icon: Sliders, badge: null },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'settings') {
      onOpenSettings();
    } else {
      setActiveTab(id);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <>
      <div className="space-y-4">
        {/* Mobile Header Close row */}
        <div className="flex md:hidden items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
            OmniFlow Navigation
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-700 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono tabular-nums rounded ${
                      item.isAlert
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 font-bold'
                        : 'text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Global Notifications Trigger Button */}
          {onOpenNotifications && (
            <button
              onClick={() => {
                onOpenNotifications();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors group mt-1"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span>Notifications</span>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadNotificationsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono rounded-full bg-rose-500 text-white animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  N
                </kbd>
              </div>
            </button>
          )}

          {/* Keyboard Shortcuts Trigger Button */}
          {onOpenShortcuts && (
            <button
              onClick={() => {
                onOpenShortcuts();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors group mt-1"
            >
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span>Shortcuts</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                ?
              </kbd>
            </button>
          )}
        </div>
      </div>

      {/* Footer lockup: Android APK button, Live System Resource Monitor & User Profile */}
      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        {/* Quick Android APK Download Button in Sidebar */}
        {onOpenApkModal && (
          <button
            onClick={() => {
              onOpenApkModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Download Android APK</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-600 text-white px-1.5 py-0.5 rounded">
              .apk
            </span>
          </button>
        )}

        {/* Live System Resource Monitoring Widget */}
        <SystemResourceWidget localAgent={localAgent} />

        {/* Push to GitHub Button */}
        {onOpenGitHubUpload && (
          <button
            onClick={() => {
              onOpenGitHubUpload();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-white" />
              <span>Push to GitHub</span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-600 px-1.5 py-0.5 rounded">
              @tushar
            </span>
          </button>
        )}

        {/* Deploy to Vercel Button */}
        {onOpenVercelDeploy && (
          <button
            onClick={() => {
              onOpenVercelDeploy();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-black text-white hover:bg-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-800 text-xs font-semibold transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 1L24 22H0L12 1Z" />
              </svg>
              <span>Deploy to Vercel</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-850">
              Live
            </span>
          </button>
        )}

        {/* Deploy to Netlify / Nestify Button */}
        {onOpenNetlifyDeploy && (
          <button
            onClick={() => {
              onOpenNetlifyDeploy();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-teal-950/90 text-teal-100 hover:bg-teal-900 border border-teal-800/80 text-xs font-semibold transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 fill-current text-teal-400" viewBox="0 0 24 24">
                <path d="M6.49 19.09h-.12a.68.68 0 0 1-.58-.69V5.6a.68.68 0 0 1 .58-.69h.12a.7.7 0 0 1 .6.35l7.91 13.83zm10.9-1.28l-4.1-7.17 4.1-7.17a.69.69 0 0 1 1.2 0l4.1 7.17-4.1 7.17a.69.69 0 0 1-1.2 0zM12 9.43L8.85 3.93a.7.7 0 0 1 .61-1.05h6.08a.7.7 0 0 1 .61 1.05L13 9.43a1.15 1.15 0 0 1-1 0z" />
              </svg>
              <span>Netlify / Nestify</span>
            </div>
            <span className="text-[10px] font-mono text-teal-300 bg-teal-900/90 px-1.5 py-0.5 rounded border border-teal-700">
              Edge
            </span>
          </button>
        )}

        {/* Google Drive Upload & Backup Button */}
        {onOpenGoogleDrive && (
          <button
            onClick={() => {
              onOpenGoogleDrive();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-50/80 text-blue-900 dark:bg-blue-950/70 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Google Drive Backup</span>
            </div>
            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/80 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700">
              Drive v3
            </span>
          </button>
        )}

        {/* Tushar Solanki profile lockup */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-300 dark:border-slate-700 shadow-2xs">
            <img
              src="https://avatars.githubusercontent.com/u/286530512?v=4"
              alt="Tushar Solanki"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="hidden">TS</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-[11px]">
              Tushar Solanki
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
              @tusharsolanki9845-dev
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#0b101b]/70 backdrop-blur-xl flex-col justify-between p-3.5 min-h-[calc(100vh-3.5rem)] select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-md flex animate-in fade-in duration-150">
          <div className="w-72 bg-white/95 dark:bg-[#0b101b]/95 backdrop-blur-2xl h-full p-4 flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
