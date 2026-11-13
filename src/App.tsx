/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useOmniFlowStore } from './services/store';
import { TopBar } from './components/TopBar';
import { NavigationSidebar } from './components/NavigationSidebar';
import { ChatWorkbench } from './components/ChatWorkbench';
import { UniversalActionConsole } from './components/UniversalActionConsole';
import { ApprovalQueue } from './components/ApprovalQueue';
import { ConnectorRegistry } from './components/ConnectorRegistry';
import { LocalAgentView } from './components/LocalAgentView';
import { AutomationsView } from './components/AutomationsView';
import { AuditLogView } from './components/AuditLogView';
import { UsageAnalyticsView } from './components/UsageAnalyticsView';
import { SettingsModal } from './components/SettingsModal';
import { ProjectsHubView } from './components/ProjectsHubView';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useAutoTheme } from './hooks/useAutoTheme';
import { ThemeSchedulerModal } from './components/ThemeSchedulerModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { GitHubUploadModal } from './components/GitHubUploadModal';
import { VercelDeployModal } from './components/VercelDeployModal';
import { NetlifyDeployModal } from './components/NetlifyDeployModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { GoogleDriveUploadModal } from './components/GoogleDriveUploadModal';
import { FolderGit2, Terminal, Cpu, ShieldCheck, Menu } from 'lucide-react';

export default function App() {
  const {
    state,
    approveAction,
    rejectAction,
    batchApproveActions,
    batchRejectActions,
    testConnection,
    toggleConnection,
    addConnection,
    generatePlanFromIntent,
    executePlanStep,
    sendChatMessage,
    clearMessages,
    toggleAutomation,
    addAutomation,
    deleteAutomation,
    triggerAutomation,
    toggleProjectTask,
    addProject,
    updateGatewaySettings,
    resetToDefaults,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    clearAllNotifications,
    toggleNotificationSound,
    simulateTaskCompleted,
    simulateTaskFailed,
    simulateUrgentApproval,
  } = useOmniFlowStore();

  const [activeTab, setActiveTab] = useState<string>('projects');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isThemeSchedulerOpen, setIsThemeSchedulerOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState<boolean>(false);
  const [isNetlifyModalOpen, setIsNetlifyModalOpen] = useState<boolean>(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Auto-Theme Scheduler
  const {
    config: themeConfig,
    isDark: isDarkMode,
    nextTransitionText,
    setMode: setThemeMode,
    updateConfig: updateThemeConfig,
  } = useAutoTheme();

  // Global Keyboard Shortcuts (⌘K, ?, 1-9, T, S, A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Command Palette (⌘K / Ctrl+K) works everywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // '?' key toggles Keyboard Shortcuts Modal (when not actively typing in an input)
      if (!isInputActive && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Fast tab switching (1-9) & quick modal triggers when not typing and no modal is active
      if (
        !isInputActive &&
        !isShortcutsOpen &&
        !isCommandPaletteOpen &&
        !isSettingsOpen &&
        !isThemeSchedulerOpen &&
        !isApkModalOpen
      ) {
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

        if (tabMap[e.key]) {
          e.preventDefault();
          setActiveTab(tabMap[e.key]);
          return;
        }

        if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsThemeSchedulerOpen(true);
          return;
        }

        if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsSettingsOpen(true);
          return;
        }

        if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsApkModalOpen(true);
          return;
        }

        if (e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsVercelModalOpen(true);
          return;
        }

        if (e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsNetlifyModalOpen(true);
          return;
        }

        if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsGitHubModalOpen(true);
          return;
        }

        if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsNotificationsOpen((prev) => !prev);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isShortcutsOpen,
    isCommandPaletteOpen,
    isSettingsOpen,
    isThemeSchedulerOpen,
    isApkModalOpen,
    isVercelModalOpen,
    isGitHubModalOpen,
    isNotificationsOpen,
  ]);

  // Compute pending approvals count
  const pendingApprovalsCount = state.actions.filter(
    (a) => a.status === 'pending_approval'
  ).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors relative selection:bg-indigo-500/25 overflow-x-hidden">
      {/* Modern Ambient Mesh & Aura Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 modern-grid-bg opacity-40 dark:opacity-25" />
      <div className="fixed -top-48 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-b from-indigo-500/12 dark:from-indigo-600/18 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Bar Contract (3 zones) */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
        isDarkMode={isDarkMode}
        themeConfig={themeConfig}
        nextTransitionText={nextTransitionText}
        onSetThemeMode={setThemeMode}
        onOpenThemeScheduler={() => setIsThemeSchedulerOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenGitHubUpload={() => setIsGitHubModalOpen(true)}
        onOpenVercelDeploy={() => setIsVercelModalOpen(true)}
        onOpenNetlifyDeploy={() => setIsNetlifyModalOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
        unreadNotificationsCount={state.notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Desktop + Mobile Slide-Over Drawer) */}
        <NavigationSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingApprovalsCount={pendingApprovalsCount}
          connections={state.connections}
          localAgent={state.localAgent}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenApkModal={() => setIsApkModalOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenGitHubUpload={() => setIsGitHubModalOpen(true)}
          onOpenVercelDeploy={() => setIsVercelModalOpen(true)}
          onOpenNetlifyDeploy={() => setIsNetlifyModalOpen(true)}
          onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
          unreadNotificationsCount={state.notifications.filter((n) => !n.read).length}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 min-h-[calc(100vh-3.5rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {activeTab === 'projects' && (
            <ProjectsHubView
              projects={state.projects}
              onToggleTask={toggleProjectTask}
              onAddProject={addProject}
              onOpenGitHubUpload={() => setIsGitHubModalOpen(true)}
              onOpenApkModal={() => setIsApkModalOpen(true)}
              onOpenVercelDeploy={() => setIsVercelModalOpen(true)}
              onOpenNetlifyDeploy={() => setIsNetlifyModalOpen(true)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatWorkbench
              models={state.models}
              messages={state.messages}
              connections={state.connections}
              onSendMessage={sendChatMessage}
              onClearMessages={clearMessages}
              onOpenApprovals={() => setActiveTab('approvals')}
            />
          )}

          {activeTab === 'actions' && (
            <UniversalActionConsole
              planSteps={[]}
              onGeneratePlan={generatePlanFromIntent}
              onExecuteStep={executePlanStep}
              onOpenApprovals={() => setActiveTab('approvals')}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalQueue
              actions={state.actions}
              onApprove={approveAction}
              onReject={rejectAction}
              onBatchApprove={batchApproveActions}
              onBatchReject={batchRejectActions}
            />
          )}

          {activeTab === 'connectors' && (
            <ConnectorRegistry
              connections={state.connections}
              onTestConnection={testConnection}
              onToggleConnection={toggleConnection}
              onAddConnection={addConnection}
              onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
            />
          )}

          {activeTab === 'files' && (
            <LocalAgentView
              files={state.localFiles}
              agentConfig={state.localAgent}
            />
          )}

          {activeTab === 'automations' && (
            <AutomationsView
              automations={state.automations}
              onToggle={toggleAutomation}
              onTrigger={triggerAutomation}
              onAddAutomation={addAutomation}
              onDeleteAutomation={deleteAutomation}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView
              logs={state.auditLogs}
              onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
            />
          )}

          {activeTab === 'usage' && (
            <UsageAnalyticsView
              settings={state.gatewaySettings}
              models={state.models}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#0b101b]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-3 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around text-[10px] font-medium text-slate-500 dark:text-slate-400 select-none shadow-lg shadow-black/5">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            activeTab === 'projects'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Projects</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            activeTab === 'actions'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Console</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            activeTab === 'chat'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`relative flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
            activeTab === 'approvals'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 p-1 rounded-xl transition-colors hover:text-slate-900 dark:hover:text-slate-200"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={state.gatewaySettings}
        models={state.models}
        onUpdate={updateGatewaySettings}
        onReset={resetToDefaults}
      />

      {/* Quick Command Palette (Cmd + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        projects={state.projects}
        auditLogs={state.auditLogs}
        messages={state.messages}
        onNavigate={(tab) => setActiveTab(tab)}
        onRunScenario={(prompt) => {
          generatePlanFromIntent(prompt);
          setActiveTab('actions');
        }}
        onOpenNetlifyDeploy={() => setIsNetlifyModalOpen(true)}
        onOpenVercelDeploy={() => setIsVercelModalOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
      />

      {/* Auto-Theme Scheduler Modal */}
      <ThemeSchedulerModal
        isOpen={isThemeSchedulerOpen}
        onClose={() => setIsThemeSchedulerOpen(false)}
        config={themeConfig}
        isDark={isDarkMode}
        nextTransitionText={nextTransitionText}
        onUpdateConfig={updateThemeConfig}
        onSetMode={setThemeMode}
      />

      {/* Android APK & Mobile Package Modal */}
      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal (?) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenThemeScheduler={() => setIsThemeSchedulerOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenVercelDeploy={() => setIsVercelModalOpen(true)}
        onOpenNetlifyDeploy={() => setIsNetlifyModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* GitHub Direct Upload & Export Modal */}
      <GitHubUploadModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

      {/* Vercel hosting requirements */}
      <VercelDeployModal
        isOpen={isVercelModalOpen}
        onClose={() => setIsVercelModalOpen(false)}
      />

      {/* Hosting requirements */}
      <NetlifyDeployModal
        isOpen={isNetlifyModalOpen}
        onClose={() => setIsNetlifyModalOpen(false)}
      />

      {/* Google Drive Direct Project Upload & Backup Modal */}
      <GoogleDriveUploadModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
        logs={state.auditLogs}
        connections={state.connections}
        models={state.models}
      />

      {/* Global Notifications Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={state.notifications}
        soundEnabled={state.notificationSoundEnabled}
        onToggleSound={toggleNotificationSound}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onDismiss={dismissNotification}
        onClearAll={clearAllNotifications}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsNotificationsOpen(false);
        }}
        onApproveAction={approveAction}
        onSimulateCompleted={() => simulateTaskCompleted()}
        onSimulateFailed={() => simulateTaskFailed()}
        onSimulateUrgentApproval={() => simulateUrgentApproval()}
      />

      {/* Floating Global Notification Toasts */}
      <NotificationToastContainer
        notifications={state.notifications}
        onDismiss={dismissNotification}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onApproveAction={approveAction}
      />

      {/* Offline Status Warning */}
      <OfflineIndicator />
    </div>
  );
}
