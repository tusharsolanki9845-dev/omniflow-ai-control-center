import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Clock,
  Compass,
  Laptop,
  X,
  Check,
  Sparkles,
  Sliders,
  Eye,
  AlertCircle,
  Sunset,
  Sunrise,
} from 'lucide-react';
import { ThemeMode, ThemeScheduleConfig } from '../types';

interface ThemeSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ThemeScheduleConfig;
  isDark: boolean;
  nextTransitionText: string;
  onUpdateConfig: (partial: Partial<ThemeScheduleConfig>) => void;
  onSetMode: (mode: ThemeMode) => void;
}

export const ThemeSchedulerModal: React.FC<ThemeSchedulerModalProps> = ({
  isOpen,
  onClose,
  config,
  isDark,
  nextTransitionText,
  onUpdateConfig,
  onSetMode,
}) => {
  const [sunrise, setSunrise] = useState(config.sunriseTime || '06:30');
  const [sunset, setSunset] = useState(config.sunsetTime || '18:30');
  const [useGeo, setUseGeo] = useState(config.useGeolocation || false);
  const [autoDim, setAutoDim] = useState(config.autoDimming !== false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateConfig({
      sunriseTime: sunrise,
      sunsetTime: sunset,
      useGeolocation: useGeo,
      autoDimming: autoDim,
    });
    onClose();
  };

  const applyPreset = (rise: string, set: string) => {
    setSunrise(rise);
    setSunset(set);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Auto-Theme Scheduler
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Ergonomic sunrise/sunset display timing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status pill */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{nextTransitionText}</span>
        </div>

        {/* Mode Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Theme Operating Mode
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onSetMode('schedule')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                config.mode === 'schedule'
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold ring-1 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <div>Auto Schedule</div>
                <div className="text-[10px] text-slate-400 font-normal">Sunrise / Sunset</div>
              </div>
            </button>

            <button
              onClick={() => onSetMode('system')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                config.mode === 'system'
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold ring-1 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Laptop className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <div>OS System</div>
                <div className="text-[10px] text-slate-400 font-normal">Sync with device</div>
              </div>
            </button>

            <button
              onClick={() => onSetMode('dark')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                config.mode === 'dark'
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold ring-1 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div>Always Dark</div>
                <div className="text-[10px] text-slate-400 font-normal">Constant night</div>
              </div>
            </button>

            <button
              onClick={() => onSetMode('light')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                config.mode === 'light'
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold ring-1 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <div>Always Light</div>
                <div className="text-[10px] text-slate-400 font-normal">Constant day</div>
              </div>
            </button>
          </div>
        </div>

        {/* Schedule Custom Time Controls */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Schedule Times
            </span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-400">Presets:</span>
              <button
                onClick={() => applyPreset('06:30', '18:30')}
                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
              >
                Standard
              </button>
              <button
                onClick={() => applyPreset('08:00', '20:30')}
                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
              >
                Night Owl
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
              <label className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-300 text-[11px]">
                <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                <span>Sunrise (Light)</span>
              </label>
              <input
                type="time"
                value={sunrise}
                onChange={(e) => setSunrise(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1.5">
              <label className="flex items-center gap-1.5 font-semibold text-indigo-900 dark:text-indigo-300 text-[11px]">
                <Sunset className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sunset (Dark)</span>
              </label>
              <input
                type="time"
                value={sunset}
                onChange={(e) => setSunset(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Geolocation Solar Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2 text-xs">
              <Compass className="w-4 h-4 text-slate-400" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Auto-Detect Solar Times
                </div>
                <div className="text-[10px] text-slate-400">
                  Calculates real sunrise/sunset based on browser coordinates
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={useGeo}
              onChange={(e) => setUseGeo(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
          </label>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};
