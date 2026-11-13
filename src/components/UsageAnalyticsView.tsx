import React from 'react';
import {
  BarChart3,
  Coins,
  Cpu,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { GatewaySettings, ModelConfig } from '../types';

interface UsageProps {
  settings: GatewaySettings;
  models: ModelConfig[];
}

export const UsageAnalyticsView: React.FC<UsageProps> = ({ settings, models }) => {
  const budgetPct = Math.round((settings.currentMonthSpendUsd / settings.monthlyBudgetCapUsd) * 100);

  const modelUsage = [
    { name: 'Gemini 2.5 Flash', provider: 'Google / LiteLLM', requests: 482, tokens: '1.42M', cost: '$1.42', latency: '340ms' },
    { name: 'Claude 3.7 Sonnet', provider: 'Anthropic / OpenRouter', requests: 124, tokens: '420K', cost: '$24.60', latency: '680ms' },
    { name: 'GPT-4.5 Turbo', provider: 'OpenAI / LiteLLM', requests: 62, tokens: '210K', cost: '$10.50', latency: '710ms' },
    { name: 'DeepSeek R1', provider: 'DeepSeek / LiteLLM', requests: 180, tokens: '580K', cost: '$1.93', latency: '920ms' },
    { name: 'Llama 3.3 70B', provider: 'Local Workstation', requests: 94, tokens: '310K', cost: '$0.00', latency: '420ms' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <BarChart3 className="w-4 h-4" />
          <span>Gateway Analytics</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
          Usage & Cost Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Real-time metrics on token consumption, provider routing fees, and tool execution latency.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Monthly Spend</span>
            <Coins className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            ${settings.currentMonthSpendUsd.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500">
            Cap: ${settings.monthlyBudgetCapUsd.toFixed(2)} ({budgetPct}%)
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${budgetPct > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
              style={{ width: `${Math.min(budgetPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Total Invocations</span>
            <Cpu className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            942
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
            <span>+18.4%</span>
            <span className="text-slate-400 font-sans">vs last week</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Total Tokens</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            2.94M
          </div>
          <div className="text-xs text-slate-500 font-mono">
            78% input · 22% output
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Average Latency</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            442ms
          </div>
          <div className="text-xs text-slate-500 font-mono">
            P95: 860ms · P99: 1.2s
          </div>
        </div>
      </div>

      {/* Model Breakdown Table */}
      <div className="bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 font-semibold text-xs text-slate-900 dark:text-slate-100">
          Consumption by Model & Gateway Provider
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4">Model Name</th>
                <th className="py-3 px-4">Gateway Route</th>
                <th className="py-3 px-4 text-right">Requests</th>
                <th className="py-3 px-4 text-right">Tokens</th>
                <th className="py-3 px-4 text-right">Avg Latency</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {modelUsage.map((m, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {m.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {m.provider}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {m.requests}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {m.tokens}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {m.latency}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                    {m.cost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
