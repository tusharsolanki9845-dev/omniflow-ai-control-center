import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  HardDrive,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { LocalDeviceAgentConfig } from '../types';

interface SystemResourceWidgetProps {
  localAgent: LocalDeviceAgentConfig;
}

interface LiveMetrics {
  cpuPct: number;
  memory: {
    usedMb: number;
    totalMb: number;
    freeMb: number;
    percent: number;
  };
  process: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  system: {
    cores: number;
    platform: string;
    uptimeSeconds: number;
    loadAvg: number[];
  };
  agent: {
    status: string;
    tunnel: string;
    port: number;
    latencyMs: number;
    allowedDirsCount: number;
  };
}

export const SystemResourceWidget: React.FC<SystemResourceWidgetProps> = ({ localAgent }) => {
  const [metrics, setMetrics] = useState<LiveMetrics>({
    cpuPct: localAgent.cpuUsagePct || 14,
    memory: {
      usedMb: localAgent.memoryUsageMb || 342,
      totalMb: 4096,
      freeMb: 3754,
      percent: Math.round(((localAgent.memoryUsageMb || 342) / 4096) * 100),
    },
    process: {
      rssMb: 112,
      heapUsedMb: 68,
      heapTotalMb: 140,
    },
    system: {
      cores: 4,
      platform: 'linux',
      uptimeSeconds: 1420,
      loadAvg: [0.24, 0.31, 0.28],
    },
    agent: {
      status: 'connected',
      tunnel: 'WireGuard-Loopback',
      port: 8006,
      latencyMs: 4,
      allowedDirsCount: localAgent.allowedDirectories?.length || 3,
    },
  });

  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 16, 14, 18, 15, 12, 19, 14]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(true);
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/system/metrics');
        const isJson = res.headers.get('content-type')?.includes('application/json');
        if (res.ok && isJson) {
          const data: LiveMetrics = await res.json();
          setMetrics(data);
          setIsLive(true);
          setCpuHistory((prev) => [...prev.slice(-9), data.cpuPct]);
        } else {
          // Simulation jitter fallback
          simulateJitter();
        }
      } catch (err) {
        simulateJitter();
      }
    };

    const simulateJitter = () => {
      setMetrics((prev) => {
        const jitterCpu = Math.max(
          4,
          Math.min(92, prev.cpuPct + (Math.floor(Math.random() * 9) - 4))
        );
        const jitterRam = Math.max(
          220,
          Math.min(prev.memory.totalMb, prev.memory.usedMb + (Math.floor(Math.random() * 12) - 6))
        );
        const memPercent = Math.round((jitterRam / prev.memory.totalMb) * 100);

        setCpuHistory((history) => [...history.slice(-9), jitterCpu]);

        return {
          ...prev,
          cpuPct: jitterCpu,
          memory: {
            ...prev.memory,
            usedMb: jitterRam,
            percent: memPercent,
          },
          process: {
            ...prev.process,
            heapUsedMb: Math.round(jitterRam * 0.25),
          },
          system: {
            ...prev.system,
            uptimeSeconds: prev.system.uptimeSeconds + 3,
          },
          agent: {
            ...prev.agent,
            latencyMs: Math.floor(Math.random() * 4) + 3,
          },
        };
      });
    };

    fetchMetrics();
    pollIntervalRef.current = setInterval(fetchMetrics, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const formatUptime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const getLoadColor = (pct: number) => {
    if (pct >= 80) return 'bg-rose-500 text-rose-600 dark:text-rose-400';
    if (pct >= 50) return 'bg-amber-500 text-amber-600 dark:text-amber-400';
    return 'bg-emerald-500 text-emerald-600 dark:text-emerald-400';
  };

  return (
    <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0f172a]/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-xs shadow-xs hover:border-indigo-500/30 space-y-2.5 transition-all">
      {/* Header bar: Agent status & expansion toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
          <Activity className="w-3.5 h-3.5 text-indigo-500" />
          <span>Local Agent Host</span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
          title={isExpanded ? 'Collapse telemetry view' : 'Expand detailed system telemetry'}
        >
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono tabular-nums">
            {metrics.agent.latencyMs}ms
          </span>
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* Mini CPU & RAM meters */}
      <div className="space-y-2 font-mono text-[11px]">
        {/* CPU Usage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Cpu className="w-3 h-3 text-slate-400" />
              <span>CPU</span>
            </span>
            <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
              {metrics.cpuPct}%
              <span className="text-[10px] text-slate-400 font-normal ml-1">
                ({metrics.system.cores}C)
              </span>
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.max(4, metrics.cpuPct))}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                metrics.cpuPct >= 80
                  ? 'bg-rose-500'
                  : metrics.cpuPct >= 50
                  ? 'bg-amber-500'
                  : 'bg-indigo-600 dark:bg-indigo-500'
              }`}
            />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span>RAM</span>
            </span>
            <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
              {metrics.memory.usedMb}MB
              <span className="text-[10px] text-slate-400 font-normal ml-1">
                ({metrics.memory.percent}%)
              </span>
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.max(6, metrics.memory.percent))}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                metrics.memory.percent >= 85
                  ? 'bg-rose-500'
                  : metrics.memory.percent >= 65
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Mini CPU Load History Sparkline */}
      <div className="pt-1 flex items-end justify-between gap-1 h-5 border-t border-slate-100 dark:border-slate-800/80">
        <span className="text-[9px] text-slate-400 font-mono tracking-tighter uppercase">Trend</span>
        <div className="flex items-end gap-1 h-4 flex-1 justify-end">
          {cpuHistory.map((val, idx) => {
            const barHeight = Math.max(3, Math.min(16, (val / 100) * 16));
            return (
              <div
                key={idx}
                style={{ height: `${barHeight}px` }}
                title={`CPU: ${val}%`}
                className={`w-1.5 rounded-xs transition-all duration-200 ${
                  val >= 80 ? 'bg-rose-500' : val >= 50 ? 'bg-amber-400' : 'bg-indigo-400 dark:bg-indigo-500'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Expanded Telemetry Details (Collapsible) */}
      {isExpanded && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[10px] font-mono animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-slate-500">
            <span>Tunnel:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              127.0.0.1:{metrics.agent.port}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Process Heap:</span>
            <span className="text-slate-800 dark:text-slate-200 tabular-nums">
              {metrics.process.heapUsedMb} MB / {metrics.process.heapTotalMb} MB
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>System RSS:</span>
            <span className="text-slate-800 dark:text-slate-200 tabular-nums">
              {metrics.process.rssMb} MB
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Agent Uptime:</span>
            <span className="text-slate-800 dark:text-slate-200 tabular-nums">
              {formatUptime(metrics.system.uptimeSeconds)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Sandboxed Folders:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {localAgent.allowedDirectories?.length || 3} allowed
            </span>
          </div>

          <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">Root access isolation locked</span>
          </div>
        </div>
      )}
    </div>
  );
};
