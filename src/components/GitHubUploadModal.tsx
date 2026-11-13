import React from 'react';
import { ExternalLink, Github, X } from 'lucide-react';

interface GitHubUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REPOSITORY_URL = 'https://github.com/tusharsolanki9845-dev/omniflow-ai-control-center';

export const GitHubUploadModal: React.FC<GitHubUploadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-xs sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="github-repository-title"
        className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="h-5 w-5 text-slate-800 dark:text-slate-200" />
            <h2 id="github-repository-title" className="font-bold text-slate-900 dark:text-slate-100">
              OmniFlow repository
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close repository dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="break-all text-xs text-slate-600 dark:text-slate-300">{REPOSITORY_URL}</p>

        <div className="flex flex-wrap gap-3">
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Open repository <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={`${REPOSITORY_URL}/archive/refs/heads/main.zip`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Download source archive
          </a>
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4 text-xs dark:border-slate-800">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Clone with Git</p>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-slate-200">
            git clone {REPOSITORY_URL}.git
          </pre>
          <p className="text-slate-500 dark:text-slate-400">
            This app does not collect GitHub tokens or push changes on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
};
