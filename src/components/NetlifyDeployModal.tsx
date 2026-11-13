import React from 'react';
import { ExternalLink, Server, X } from 'lucide-react';

interface NetlifyDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetlifyDeployModal: React.FC<NetlifyDeployModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hosting-options-title"
        className="w-full max-w-xl space-y-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-indigo-500" />
            <h2 id="hosting-options-title" className="font-bold text-slate-900 dark:text-slate-100">
              Hosting requirements
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close hosting options"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          OmniFlow uses an Express API for AI requests and runtime metrics. A static-site deployment alone will not provide those API routes; use a host that supports a persistent Node.js process or Docker container.
        </p>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/40">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Container deployment</p>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-slate-200">
{`docker build -t omniflow .
docker run -p 3000:3000 -e GEMINI_API_KEY=... omniflow`}
          </pre>
          <p className="text-slate-500 dark:text-slate-400">
            Set secrets in the hosting provider's environment settings. Do not paste API keys into this interface or commit them to source control.
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Provider notes</p>
          <p className="text-slate-600 dark:text-slate-300">
            Netlify's static hosting setup in this project does not run the Express API. Before using Nestify, confirm directly with the provider that your plan supports Node.js applications or Docker containers.
          </p>
          <div className="flex flex-wrap gap-4 pt-1">
            <a
              href="https://docs.netlify.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Netlify documentation <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://nestify.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Nestify <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
