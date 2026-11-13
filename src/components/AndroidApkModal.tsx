import React from 'react';
import { ExternalLink, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-xs sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-app-title"
        className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 id="install-app-title" className="font-bold text-slate-900 dark:text-slate-100">
                Install OmniFlow
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add the web app to your device</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close install dialog"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">No signed Android APK is currently available.</p>
          <p className="text-xs leading-relaxed">
            OmniFlow can be installed as a Progressive Web App (PWA) from a supported browser. This does not download or install a standalone APK.
          </p>
        </div>

        {isInstalled ? (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            OmniFlow is already installed on this device.
          </p>
        ) : isInstallable ? (
          <button
            type="button"
            onClick={() => void install()}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Install OmniFlow
          </button>
        ) : (
          <div className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              {isIOS
                ? 'In Safari, tap Share, then choose “Add to Home Screen”.'
                : 'Open your browser menu and choose “Install app” or “Add to Home screen” when available.'}
            </p>
            <a
              href="https://web.dev/learn/pwa/installation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Learn about PWA installation
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
