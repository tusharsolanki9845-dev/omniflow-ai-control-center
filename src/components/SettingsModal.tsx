import React, { useState } from 'react';
import {
  Sliders,
  ShieldAlert,
  Key,
  Database,
  RotateCcw,
  X,
  Check,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { GatewaySettings, ModelConfig } from '../types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GatewaySettings;
  models: ModelConfig[];
  onUpdate: (updated: Partial<GatewaySettings>) => void;
  onReset: () => void;
}

export const SettingsModal: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  settings,
  models,
  onUpdate,
  onReset,
}) => {
  if (!isOpen) return null;

  const [primaryGateway, setPrimaryGateway] = useState(settings.primaryGateway);
  const [gatewayEndpoint, setGatewayEndpoint] = useState(settings.gatewayEndpoint);
  const [defaultModelId, setDefaultModelId] = useState(settings.defaultModelId);
  const [defaultDeny, setDefaultDeny] = useState(settings.defaultDenyHighRisk);
  const [strictSandbox, setStrictSandbox] = useState(settings.localSandboxingStrict);
  const [require2FA, setRequire2FA] = useState(settings.require2FAForCritical);
  const [budgetCap, setBudgetCap] = useState(settings.monthlyBudgetCapUsd);
  const [savedNotice, setSavedNotice] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      primaryGateway,
      gatewayEndpoint,
      defaultModelId,
      defaultDenyHighRisk: defaultDeny,
      localSandboxingStrict: strictSandbox,
      require2FAForCritical: require2FA,
      monthlyBudgetCapUsd: Number(budgetCap),
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              OmniFlow Gateway & Security Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Gateway Routing */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Unified Model Gateway Architecture
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Routing Gateway
                </label>
                <select
                  value={primaryGateway}
                  onChange={(e) => setPrimaryGateway(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                >
                  <option value="litellm">LiteLLM Proxy (Self-Hosted)</option>
                  <option value="openrouter">OpenRouter (Hosted Gateway)</option>
                  <option value="gemini_direct">Google Gemini Direct (SDK)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Fallback Model
                </label>
                <select
                  value={defaultModelId}
                  onChange={(e) => setDefaultModelId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gateway Base URI
              </label>
              <input
                type="text"
                value={gatewayEndpoint}
                onChange={(e) => setGatewayEndpoint(e.target.value)}
                className="w-full font-mono bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Security Guardrails */}
          <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
              <span>Strict Security & Sandboxing Rules</span>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={defaultDeny}
                onChange={(e) => setDefaultDeny(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  Default-Deny External Writes & State Mutation
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Enforces that all actions modifying external databases, sending emails, or deleting files must be queued for explicit user confirmation.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={strictSandbox}
                onChange={(e) => setStrictSandbox(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  Strict Path Sandboxing for Local Device Agent
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Restricts local agent filesystem operations strictly to allowlisted directories (~/Downloads, ~/Documents/Invoices).
                </div>
              </div>
            </label>
          </div>

          {/* Spending Caps */}
          <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Budget & Cost Enforcement
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Hard Budget Limit (USD)
              </label>
              <input
                type="number"
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value))}
                className="w-full font-mono bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Secrets Management Notice */}
          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero Browser API Keys Architecture</span>
            </div>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
              Provider credentials (OpenRouter, LiteLLM tokens, Google API keys, Notion OAuth) reside exclusively on your backend service or Doppler vault. The browser receives only short-lived session tokens.
            </p>
          </div>

          {/* Reset confirmation banner */}
          {showResetConfirm && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Confirm Factory Reset?</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-300">
                This will reset all projects, approval actions, logs, and local configuration back to defaults.
              </p>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 text-[11px] bg-slate-200 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setShowResetConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1 text-[11px] font-semibold bg-rose-600 text-white rounded-md hover:bg-rose-500 shadow-xs"
                >
                  Yes, Reset Everything
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-xs shadow-indigo-500/20 flex items-center gap-1.5"
              >
                {savedNotice ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{savedNotice ? 'Saved!' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
