import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Activity,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RotateCcw,
  Layers,
  Zap,
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditActivityChartProps {
  logs: AuditLog[];
  selectedDateFilter?: string | null;
  onSelectDateFilter?: (dateStr: string | null) => void;
}

type TimeRangeOption = '7d' | '14d' | 'all';
type MetricDisplayMode = 'total' | 'detailed';

interface DailyAggregate {
  rawDate: string; // YYYY-MM-DD
  dateLabel: string; // "Nov 04"
  fullDateLabel: string; // "Wednesday, Nov 04, 2026"
  total: number;
  success: number;
  failed: number;
  pending: number;
  avgLatency: number;
  topTools: string[];
}

export const AuditActivityChart: React.FC<AuditActivityChartProps> = ({
  logs,
  selectedDateFilter,
  onSelectDateFilter,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('14d');
  const [metricMode, setMetricMode] = useState<MetricDisplayMode>('detailed');

  // Helper to parse dates into YYYY-MM-DD reliably
  const extractDateKey = (timestamp: string): string => {
    if (!timestamp) return '2026-11-01';
    // Format: '2026-11-04 11:15:20' or ISO '2026-11-04T11:15:20.000Z'
    const clean = timestamp.trim().replace('T', ' ');
    const parts = clean.split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) {
      return parts;
    }
    try {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
    } catch {
      // fallback
    }
    return '2026-11-01';
  };

  // Aggregate logs by calendar day
  const dailyData = useMemo(() => {
    const map = new Map<string, {
      total: number;
      success: number;
      failed: number;
      pending: number;
      latencies: number[];
      toolsMap: Map<string, number>;
    }>();

    logs.forEach((log) => {
      const key = extractDateKey(log.timestamp);
      if (!map.has(key)) {
        map.set(key, {
          total: 0,
          success: 0,
          failed: 0,
          pending: 0,
          latencies: [],
          toolsMap: new Map(),
        });
      }

      const day = map.get(key)!;
      day.total += 1;

      if (log.status === 'SUCCESS' || log.status === 'APPROVED') {
        day.success += 1;
      } else if (log.status === 'FAILED' || log.status === 'BLOCKED' || log.status === 'REJECTED') {
        day.failed += 1;
      } else {
        day.pending += 1;
      }

      if (typeof log.latencyMs === 'number' && log.latencyMs > 0) {
        day.latencies.push(log.latencyMs);
      }

      if (log.tool) {
        day.toolsMap.set(log.tool, (day.toolsMap.get(log.tool) || 0) + 1);
      }
    });

    // Convert map to sorted array
    const sortedKeys = Array.from(map.keys()).sort();

    const result: DailyAggregate[] = sortedKeys.map((key) => {
      const day = map.get(key)!;
      const [year, month, dayNum] = key.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(dayNum));

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const monthLabel = monthNames[Number(month) - 1] || 'Nov';
      const dateLabel = `${monthLabel} ${Number(dayNum)}`;

      const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekday = !isNaN(dateObj.getDay()) ? weekdayNames[dateObj.getDay()] : '';
      const fullDateLabel = `${weekday ? `${weekday}, ` : ''}${monthLabel} ${dayNum}, ${year}`;

      const avgLatency =
        day.latencies.length > 0
          ? Math.round(day.latencies.reduce((a, b) => a + b, 0) / day.latencies.length)
          : 0;

      const topTools = Array.from(day.toolsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([t]) => t);

      return {
        rawDate: key,
        dateLabel,
        fullDateLabel,
        total: day.total,
        success: day.success,
        failed: day.failed,
        pending: day.pending,
        avgLatency,
        topTools,
      };
    });

    // Apply time range filter if needed
    if (timeRange === '7d') {
      return result.slice(-7);
    }
    if (timeRange === '14d') {
      return result.slice(-14);
    }
    return result;
  }, [logs, timeRange]);

  // Summary Metrics calculated over currently displayed window
  const summary = useMemo(() => {
    if (dailyData.length === 0) {
      return { totalOps: 0, dailyAvg: 0, peakOps: 0, peakDate: 'N/A', successRate: 100, failureCount: 0 };
    }

    const totalOps = dailyData.reduce((sum, d) => sum + d.total, 0);
    const totalSuccess = dailyData.reduce((sum, d) => sum + d.success, 0);
    const failureCount = dailyData.reduce((sum, d) => sum + d.failed, 0);
    const dailyAvg = (totalOps / dailyData.length).toFixed(1);

    let peakOps = 0;
    let peakDate = '';
    dailyData.forEach((d) => {
      if (d.total > peakOps) {
        peakOps = d.total;
        peakDate = d.dateLabel;
      }
    });

    const successRate = totalOps > 0 ? Math.round((totalSuccess / totalOps) * 100) : 100;

    return {
      totalOps,
      dailyAvg,
      peakOps,
      peakDate,
      successRate,
      failureCount,
    };
  }, [dailyData]);

  // Custom Glassmorphic Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data: DailyAggregate = payload[0].payload;
    const isSelected = selectedDateFilter === data.rawDate;

    return (
      <div className="p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-2 select-none min-w-[200px] animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
          <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            {data.fullDateLabel}
          </span>
          {isSelected && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
              Filtered
            </span>
          )}
        </div>

        <div className="space-y-1 text-[11px] font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Total Volume:</span>
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{data.total} ops</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Successful:
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{data.success}</span>
          </div>
          {data.failed > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                Failed / Blocked:
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">{data.failed}</span>
            </div>
          )}
          {data.avgLatency > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
              <span className="text-slate-400 font-sans">Avg Latency:</span>
              <span className="text-slate-700 dark:text-slate-300">{data.avgLatency}ms</span>
            </div>
          )}
        </div>

        {data.topTools && data.topTools.length > 0 && (
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="text-slate-400">Key tools:</span> {data.topTools.join(', ')}
          </div>
        )}

        {onSelectDateFilter && (
          <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium italic pt-1 text-center">
            {isSelected ? 'Click to clear date filter' : 'Click data point to isolate date in table'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden transition-all">
      {/* Chart Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-transparent">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Activity Over Time
            </h3>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80">
              Daily Operations Volume
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track daily tool dispatches, execution throughput, and error density across all connected subsystems.
          </p>
        </div>

        {/* Controls: Mode & Time Range Segmented Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Detailed vs Total Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-lg border border-slate-200/70 dark:border-slate-800/80 text-xs">
            <button
              onClick={() => setMetricMode('detailed')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                metricMode === 'detailed'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Breakdown
            </button>
            <button
              onClick={() => setMetricMode('total')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                metricMode === 'total'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Total
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-lg border border-slate-200/70 dark:border-slate-800/80 text-xs">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === '7d'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('14d')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === '14d'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === 'all'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Days
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/80 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-500" />
            Total Volume
          </span>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {summary.totalOps}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">ops</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            Daily Average
          </span>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {summary.dailyAvg}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">ops/day</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            Peak Daily Day
          </span>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums truncate">
            {summary.peakOps > 0 ? (
              <>
                {summary.peakOps}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">({summary.peakDate})</span>
              </>
            ) : (
              '—'
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Health / SLA
          </span>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {summary.successRate}%{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">
              ({summary.failureCount} fail)
            </span>
          </div>
        </div>
      </div>

      {/* Date Isolation Filter Banner if active */}
      {selectedDateFilter && (
        <div className="px-5 py-2 bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              Filtered to operations on <strong>{selectedDateFilter}</strong>
            </span>
          </div>
          {onSelectDateFilter && (
            <button
              onClick={() => onSelectDateFilter(null)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Date Filter
            </button>
          )}
        </div>
      )}

      {/* Recharts Canvas */}
      <div className="p-4 sm:p-5 pt-6">
        <div className="w-full h-[240px] sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length && onSelectDateFilter) {
                  const clickedDay: DailyAggregate = e.activePayload[0].payload;
                  if (selectedDateFilter === clickedDay.rawDate) {
                    onSelectDateFilter(null);
                  } else {
                    onSelectDateFilter(clickedDay.rawDate);
                  }
                }
              }}
            >
              <defs>
                <linearGradient id="totalOpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="successOpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800/80"
              />

              <XAxis
                dataKey="dateLabel"
                stroke="currentColor"
                className="text-slate-400 dark:text-slate-500 text-[11px] font-mono"
                tickLine={false}
                axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                dy={6}
              />

              <YAxis
                stroke="currentColor"
                className="text-slate-400 dark:text-slate-500 text-[11px] font-mono"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                dx={-4}
              />

              <Tooltip content={<CustomChartTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontFamily: 'monospace' }}
              />

              {/* Main Total Area & Line */}
              <Area
                type="monotone"
                dataKey="total"
                name="Total Operations"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#totalOpsGradient)"
                activeDot={{
                  r: 6,
                  stroke: '#6366f1',
                  strokeWidth: 2,
                  fill: '#ffffff',
                }}
              />

              {/* Success Line (Breakdown Mode) */}
              {metricMode === 'detailed' && (
                <Line
                  type="monotone"
                  dataKey="success"
                  name="Successful"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#10b981' }}
                />
              )}

              {/* Failures Line (Breakdown Mode) */}
              {metricMode === 'detailed' && (
                <Line
                  type="monotone"
                  dataKey="failed"
                  name="Failed / Blocked"
                  stroke="#f43f5e"
                  strokeWidth={1.8}
                  dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#f43f5e' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
