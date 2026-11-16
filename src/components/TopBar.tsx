import React from 'react';
import { Sparkles, AlertTriangle, Search, Menu, Smartphone, Github, Bell, Cloud, LogOut } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeSelectorButton } from './ThemeSelectorButton';
import { ThemeMode, ThemeScheduleConfig } from '../types';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
  isDarkMode: boolean;
  themeConfig?: ThemeScheduleConfig;
  nextTransitionText?: string;
  unreadNotificationsCount?: number;
  onSetThemeMode?: (mode: ThemeMode) => void;
  onOpenThemeScheduler?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenApkModal?: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts?: () => void;
  onOpenGitHubUpload?: () => void;
  onOpenVercelDeploy?: () => void;
  onOpenNetlifyDeploy?: () => void;
  onOpenGoogleDrive?: () => void;
  onOpenNotifications?: () => void;
  signedInUser: string;
  onSignOut: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  isDarkMode,
  themeConfig,
  nextTransitionText = '',
  unreadNotificationsCount = 0,
  onSetThemeMode,
  onOpenThemeScheduler,
  onToggleMobileMenu,
  onOpenApkModal,
  onOpenSettings,
  onOpenCommandPalette,
  onOpenShortcuts,
  onOpenGitHubUpload,
  onOpenVercelDeploy,
  onOpenNetlifyDeploy,
  onOpenGoogleDrive,
  onOpenNotifications,
  signedInUser,
  onSignOut,
}) => {
  return (
    <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 glass-surface sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-8 transition-colors select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]">
      {/* Zone 1: Mobile Menu Toggle + Wordmark */}
      <div className="flex items-center gap-2">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('projects');
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold shadow-xs shadow-indigo-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-base font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-200 bg-clip-text text-transparent">
            OmniFlow
          </span>
        </a>
      </div>

      {/* Zone 2: 4-5 concise single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        <button
          onClick={() => setActiveTab('projects')}
          className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-slate-100 py-1 ${
            activeTab === 'projects'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : ''
          }`}
        >
          Portfolio & AI Hub
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-slate-100 py-1 ${
            activeTab === 'actions'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : ''
          }`}
        >
          Action Console
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-slate-100 py-1 ${
            activeTab === 'approvals'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : ''
          }`}
        >
          <span>Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-full tabular-nums">
              {pendingApprovalsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('connectors')}
          className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-slate-100 py-1 ${
            activeTab === 'connectors'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : ''
          }`}
        >
          Tool Connectors
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-slate-100 py-1 ${
            activeTab === 'audit'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : ''
          }`}
        >
          Audit Ledger
        </button>
      </nav>

      {/* Zone 3: 1 primary action with quick search & theme switch */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <PWAInstallButton />

        {onOpenApkModal && (
          <button
            onClick={onOpenApkModal}
            title="Install OmniFlow as a web app"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shrink-0 shadow-2xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Install app</span>
            <span className="md:hidden">Install</span>
          </button>
        )}

        {onOpenVercelDeploy && (
          <button
            onClick={onOpenVercelDeploy}
            title="View Vercel hosting requirements"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-black dark:bg-slate-800 border border-slate-800 dark:border-slate-700 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-2xs"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M12 1L24 22H0L12 1Z" />
            </svg>
            <span className="hidden xl:inline">Vercel</span>
          </button>
        )}

        {onOpenNetlifyDeploy && (
          <button
            onClick={onOpenNetlifyDeploy}
            title="View hosting requirements"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors shrink-0 shadow-2xs"
          >
            <svg className="w-3 h-3 fill-current text-teal-600 dark:text-teal-400" viewBox="0 0 24 24">
              <path d="M6.49 19.09h-.12a.68.68 0 0 1-.58-.69V5.6a.68.68 0 0 1 .58-.69h.12a.7.7 0 0 1 .6.35l7.91 13.83zm10.9-1.28l-4.1-7.17 4.1-7.17a.69.69 0 0 1 1.2 0l4.1 7.17-4.1 7.17a.69.69 0 0 1-1.2 0zM12 9.43L8.85 3.93a.7.7 0 0 1 .61-1.05h6.08a.7.7 0 0 1 .61 1.05L13 9.43a1.15 1.15 0 0 1-1 0z" />
            </svg>
            <span className="hidden xl:inline">Hosting options</span>
            <span className="xl:hidden">Hosting</span>
          </button>
        )}

        {/* Quick Search Shortcut */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            ⌘K
          </kbd>
        </button>

        {/* Keyboard Shortcuts Cheatsheet Button */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (Press ?)"
            className="hidden sm:flex items-center justify-center w-7 h-7 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            ?
          </button>
        )}

        {/* Global Notifications Bell */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            title="Global Notifications & Automated Alerts"
            className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-rose-600 text-white rounded-full text-[9px] font-bold font-mono flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs animate-in zoom-in-75">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
        )}

        {/* Upload / Push to GitHub Button */}
        {onOpenGitHubUpload && (
          <button
            onClick={onOpenGitHubUpload}
            title="Open the OmniFlow repository"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-lg transition-all shadow-2xs shrink-0"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GitHub</span>
          </button>
        )}

        {/* Upload Project to Google Drive Button */}
        {onOpenGoogleDrive && (
          <button
            onClick={onOpenGoogleDrive}
            title="Upload project snapshot and ledger to Google Drive"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shrink-0 shadow-2xs"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">Google Drive</span>
            <span className="md:hidden">Drive</span>
          </button>
        )}

        {pendingApprovalsCount > 0 && (
          <button
            onClick={() => setActiveTab('approvals')}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{pendingApprovalsCount} Review</span>
          </button>
        )}

        {themeConfig && onSetThemeMode && onOpenThemeScheduler ? (
          <ThemeSelectorButton
            config={themeConfig}
            isDark={isDarkMode}
            nextTransitionText={nextTransitionText}
            onSetMode={onSetThemeMode}
            onOpenSchedulerModal={onOpenThemeScheduler}
          />
        ) : (
          <button
            onClick={() => onSetThemeMode && onSetThemeMode(isDarkMode ? 'light' : 'dark')}
            aria-label="Toggle color theme"
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-violet-600 dark:hover:from-indigo-500 dark:hover:to-violet-500 rounded-lg transition-all whitespace-nowrap shadow-xs shadow-indigo-500/20 active:scale-[0.98]"
        >
          Gateway Config
        </button>
        <button
          type="button"
          onClick={onSignOut}
          aria-label={`Sign out ${signedInUser}`}
          title={`Sign out ${signedInUser}`}
          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
