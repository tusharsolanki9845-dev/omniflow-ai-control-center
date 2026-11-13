import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  Clock,
  Laptop,
  ChevronDown,
  Sliders,
  Check,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { ThemeMode, ThemeScheduleConfig } from '../types';

interface ThemeSelectorButtonProps {
  config: ThemeScheduleConfig;
  isDark: boolean;
  nextTransitionText: string;
  onSetMode: (mode: ThemeMode) => void;
  onOpenSchedulerModal: () => void;
}

export const ThemeSelectorButton: React.FC<ThemeSelectorButtonProps> = ({
  config,
  isDark,
  nextTransitionText,
  onSetMode,
  onOpenSchedulerModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getModeIcon = () => {
    if (config.mode === 'schedule') {
      return (
        <div className="relative">
          {isDark ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute -bottom-0.5 -right-0.5 ring-1 ring-white dark:ring-slate-900" />
        </div>
      );
    }
    if (config.mode === 'system') {
      return <Laptop className="w-4 h-4 text-slate-400" />;
    }
    return isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Theme Mode: ${config.mode.toUpperCase()} · ${nextTransitionText}`}
        aria-label="Theme Mode Selection"
        className="flex items-center gap-1.5 p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {getModeIcon()}
        {config.mode === 'schedule' && (
          <span className="hidden xl:inline text-[10px] font-mono text-slate-400 tracking-tight">
            Auto
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Theme Schedule</span>
            <span className="font-mono lowercase text-[9px] text-indigo-600 dark:text-indigo-400">
              {config.mode}
            </span>
          </div>

          {/* Mode items */}
          <button
            onClick={() => {
              onSetMode('schedule');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
              config.mode === 'schedule'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[11px]">Auto Schedule</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {config.sunriseTime} &rarr; {config.sunsetTime}
                </div>
              </div>
            </div>
            {config.mode === 'schedule' && (
              <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
          </button>

          <button
            onClick={() => {
              onSetMode('system');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
              config.mode === 'system'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[11px]">System (OS)</div>
                <div className="text-[10px] text-slate-400">Matches device theme</div>
              </div>
            </div>
            {config.mode === 'system' && (
              <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
          </button>

          <button
            onClick={() => {
              onSetMode('dark');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
              config.mode === 'dark'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[11px]">Always Dark</div>
                <div className="text-[10px] text-slate-400">High contrast night mode</div>
              </div>
            </div>
            {config.mode === 'dark' && (
              <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
          </button>

          <button
            onClick={() => {
              onSetMode('light');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
              config.mode === 'light'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[11px]">Always Light</div>
                <div className="text-[10px] text-slate-400">Daytime light mode</div>
              </div>
            </div>
            {config.mode === 'light' && (
              <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
          </button>

          {/* Footer custom config shortcut */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSchedulerModal();
              }}
              className="w-full flex items-center justify-between p-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3 h-3" />
                <span>Custom Sunrise / Sunset...</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {nextTransitionText}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
