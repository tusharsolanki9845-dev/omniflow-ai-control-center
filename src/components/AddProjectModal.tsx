import React, { useState } from 'react';
import {
  FolderGit2,
  X,
  Plus,
  Trash2,
  Sparkles,
  Github,
  Globe,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AIProject } from '../types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: AIProject) => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onAddProject,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [repoName, setRepoName] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [aiToolOrigin, setAiToolOrigin] = useState<AIProject['aiToolOrigin']>('cursor');
  const [description, setDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('React, TypeScript, Tailwind');
  const [tasks, setTasks] = useState<string[]>([
    'Setup core repository structure and dependencies',
    'Implement primary feature module',
    'Write unit tests and configure CI/CD pipeline',
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  const handleAddTask = () => {
    if (newTaskInput.trim()) {
      setTasks([...tasks, newTaskInput.trim()]);
      setNewTaskInput('');
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !repoName.trim()) return;

    const parsedTechStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const projectId = `proj-${Date.now().toString(36)}`;
    const newProject: AIProject = {
      id: projectId,
      name: name.trim(),
      repoName: repoName.trim(),
      githubUrl: `https://github.com/tusharsolanki9845-dev/${repoName.trim()}`,
      liveUrl: liveUrl.trim() || undefined,
      aiToolOrigin,
      techStack: parsedTechStack.length > 0 ? parsedTechStack : ['React', 'TypeScript', 'Tailwind'],
      status: 'in_progress',
      completionPct: 20,
      description: description.trim() || 'AI-assisted development project tracked via OmniFlow.',
      nextAction: tasks[0] || 'Review initial implementation and dependencies',
      pendingTasks: tasks.map((t, idx) => ({
        id: `t-${projectId}-${idx + 1}`,
        title: t,
        completed: false,
        priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
      })),
      lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    onAddProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Track New AI Project
              </h2>
              <p className="text-xs text-slate-500">
                Connect repos from Cursor, v0, Bolt, Claude, or local workspaces
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Project Name & Tool Origin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AI Social Assistant"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!repoName) {
                    setRepoName(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '-')
                        .replace(/-+/g, '-')
                    );
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary AI Tool Origin
              </label>
              <select
                value={aiToolOrigin}
                onChange={(e) => setAiToolOrigin(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="cursor">Cursor AI</option>
                <option value="v0">v0.dev (Vercel)</option>
                <option value="bolt">Bolt.new</option>
                <option value="claude_artifacts">Claude Artifacts</option>
                <option value="workstation">Local Workstation / VS Code</option>
              </select>
            </div>
          </div>

          {/* GitHub Repo Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GitHub Repository Name *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700">
                github.com/tusharsolanki9845-dev/
              </span>
              <input
                type="text"
                required
                placeholder="repo-slug"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="flex-1 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Live Deployment URL */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Live URL (Optional, e.g. Vercel, Netlify)
            </label>
            <input
              type="url"
              placeholder="https://my-app.vercel.app"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tech Stack & Frameworks (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="React, TypeScript, Tailwind, Node.js"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              className="w-full font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Description & Goals
            </label>
            <textarea
              rows={2}
              placeholder="What does this project do? (e.g. Next.js SaaS app with PostgreSQL and Gemini AI streaming)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Milestone Tasks to Complete */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Milestone Tasks to Complete with AI ({tasks.length})
            </label>
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              {tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <span className="truncate text-slate-800 dark:text-slate-200">
                    {idx + 1}. {task}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(idx)}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add a milestone to complete..."
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Track Project</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
