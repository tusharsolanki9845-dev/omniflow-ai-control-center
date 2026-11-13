import React, { useState } from 'react';
import {
  FolderGit2,
  ExternalLink,
  Github,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Plus,
  RefreshCw,
  Edit3,
  Sparkles,
  Layers,
  ArrowRight,
  Code2,
  Globe,
  Check,
  ShieldCheck,
  Search,
  Smartphone,
  Download,
} from 'lucide-react';
import { AIProject } from '../types';
import { TaskCompletionModal } from './TaskCompletionModal';
import { AddProjectModal } from './AddProjectModal';

interface ProjectsHubProps {
  projects: AIProject[];
  onToggleTask: (projectId: string, taskId: string) => void;
  onAddProject?: (project: AIProject) => void;
  onOpenGitHubUpload?: () => void;
  onOpenApkModal?: () => void;
  onOpenVercelDeploy?: () => void;
  onOpenNetlifyDeploy?: () => void;
}

export const ProjectsHubView: React.FC<ProjectsHubProps> = ({
  projects,
  onToggleTask,
  onAddProject,
  onOpenGitHubUpload,
  onOpenApkModal,
  onOpenVercelDeploy,
  onOpenNetlifyDeploy,
}) => {
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState<boolean>(false);
  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    project: AIProject | null;
    taskTitle: string;
  }>({ isOpen: false, project: null, taskTitle: '' });

  const filteredProjects = projects.filter((p) => {
    const matchesTool = selectedToolFilter === 'all' || p.aiToolOrigin === selectedToolFilter;
    if (!matchesTool) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.repoName.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.pendingTasks.some((t) => t.title.toLowerCase().includes(q))
    );
  });

  const getToolBadge = (origin: AIProject['aiToolOrigin']) => {
    switch (origin) {
      case 'cursor':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800">Cursor AI</span>;
      case 'v0':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-700">v0.dev</span>;
      case 'claude_artifacts':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800">Claude Artifacts</span>;
      case 'bolt':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-800">Bolt.new</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 rounded">{origin}</span>;
    }
  };

  const getStatusBadge = (status: AIProject['status']) => {
    switch (status) {
      case 'ready_to_ship':
        return <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ready to Ship</span>;
      case 'in_progress':
        return <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> In Progress</span>;
      case 'needs_review':
        return <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Edits / Review Needed</span>;
      case 'blocked':
        return <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Blocked</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <FolderGit2 className="w-4 h-4" />
            <span>Project workspace</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Projects and task drafts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Project records are stored in this browser. Live repository synchronization and task execution are not configured.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenGitHubUpload && (
            <button
              onClick={onOpenGitHubUpload}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-md flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Github className="w-3.5 h-3.5" />
              <span>View GitHub repository</span>
            </button>
          )}

        </div>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Project workspace</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Project notes are stored in this browser. GitHub synchronization and deployment are not configured in this build.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onOpenGitHubUpload && (
            <button onClick={onOpenGitHubUpload} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900">
              View GitHub repository
            </button>
          )}
          {onOpenApkModal && (
            <button onClick={onOpenApkModal} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Install app
            </button>
          )}
          {onOpenVercelDeploy && (
            <button onClick={onOpenVercelDeploy} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Hosting requirements
            </button>
          )}
        </div>
      </section>

      {/* Filter Tabs by AI Tool Origin & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedToolFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedToolFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Projects ({projects.length})
            </button>
            <button
              onClick={() => setSelectedToolFilter('cursor')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedToolFilter === 'cursor'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Cursor
            </button>
            <button
              onClick={() => setSelectedToolFilter('v0')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedToolFilter === 'v0'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              v0
            </button>
            <button
              onClick={() => setSelectedToolFilter('claude_artifacts')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedToolFilter === 'claude_artifacts'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => setSelectedToolFilter('bolt')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedToolFilter === 'bolt'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Bolt
            </button>
          </div>

          {/* Quick search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search repos, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-56"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAddProject && (
            <button
              onClick={() => setIsAddProjectModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Track New AI Project</span>
            </button>
          )}

        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
            <FolderGit2 className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">No projects yet</h2>
            <p className="mt-1 text-xs text-slate-500">Add a project to keep its milestones and task notes in this browser.</p>
          </div>
        )}
        {filteredProjects.map((proj) => {
          return (
            <div
              key={proj.id}
              className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0d1322]/80 backdrop-blur-md shadow-xs hover:shadow-lg dark:hover:shadow-indigo-950/25 hover:border-indigo-500/40 dark:hover:border-indigo-500/30 flex flex-col justify-between space-y-4 transition-all duration-200 group"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {proj.name}
                      </h3>
                      {getToolBadge(proj.aiToolOrigin)}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      <span>{proj.repoName}</span>
                      {proj.liveUrl && (
                        <>
                          <span>·</span>
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <span>Live</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {proj.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono tabular-nums">
                    <span className="text-slate-500">Completion</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{proj.completionPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${proj.completionPct}%` }}
                    />
                  </div>
                </div>

                {/* Next action callout */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Next Step: </span>
                  <span className="text-slate-600 dark:text-slate-400">{proj.nextAction}</span>
                </div>

                {/* Pending Tasks Checklist */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Milestones to Complete ({proj.pendingTasks.filter((t) => t.completed).length}/{proj.pendingTasks.length})
                  </div>
                  <div className="space-y-1">
                    {proj.pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 group"
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => onToggleTask(proj.id, task.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span
                            className={`truncate ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {task.title}
                          </span>
                        </label>

                        {!task.completed && (
                          <button
                            onClick={() => setTaskModalState({ isOpen: true, project: proj, taskTitle: task.title })}
                            className="opacity-0 group-hover:opacity-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded transition-all shrink-0"
                          >
                            Complete with AI &rarr;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {getStatusBadge(proj.status)}

                <div className="flex items-center gap-2">
                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="View GitHub Repository"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setTaskModalState({ isOpen: true, project: proj, taskTitle: proj.nextAction })}
                    className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Work on This</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Task Completion Modal */}
      <TaskCompletionModal
        isOpen={taskModalState.isOpen}
        onClose={() => setTaskModalState({ isOpen: false, project: null, taskTitle: '' })}
        project={taskModalState.project}
        taskTitle={taskModalState.taskTitle}
      />

      {/* Track New Project Modal */}
      {onAddProject && (
        <AddProjectModal
          isOpen={isAddProjectModalOpen}
          onClose={() => setIsAddProjectModalOpen(false)}
          onAddProject={onAddProject}
        />
      )}
    </div>
  );
};
