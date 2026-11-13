import React, { useState, useMemo } from 'react';
import {
  ScrollText,
  Search,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Eye,
  Key,
  X,
  Layers,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  FileSpreadsheet,
  FileCode,
  Sliders,
  Share2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Server,
  Radio,
  HardDrive,
  Cloud,
  Shield,
  Zap,
} from 'lucide-react';
import { AuditLog, RiskLevel } from '../types';
import { AuditActivityChart } from './AuditActivityChart';
import { AuditLogExpandedDetail } from './AuditLogExpandedDetail';

interface AuditLogProps {
  logs: AuditLog[];
  onOpenGoogleDrive?: () => void;
}

export type StatusFilterType = 'ALL' | 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'PENDING' | 'REJECTED';
export type SubsystemCategoryType = 'ALL' | 'LOCAL' | 'MCP' | 'CLOUD' | 'SYSTEM';
export type RiskCategoryType = 'ALL' | 'SAFE' | 'ELEVATED' | 'CRITICAL';
export type ExportFormatType = 'CSV' | 'JSON_PRETTY' | 'JSON_MINIFIED' | 'JSONL';
export type ExportScopeType = 'FILTERED' | 'ALL' | 'FAILURES';

interface ExportFieldConfig {
  id: boolean;
  timestamp: boolean;
  event: boolean;
  tool: boolean;
  provider: boolean;
  modelUsed: boolean;
  status: boolean;
  riskLevel: boolean;
  latencyMs: boolean;
  user: boolean;
  payloadHash: boolean;
  argumentsDigest: boolean;
  errorDetails: boolean;
}

const DEFAULT_FIELDS: ExportFieldConfig = {
  timestamp: true,
  event: true,
  tool: true,
  provider: true,
  modelUsed: true,
  status: true,
  riskLevel: true,
  latencyMs: true,
  user: true,
  payloadHash: true,
  argumentsDigest: true,
  errorDetails: true,
  id: true,
};

export const AuditLogView: React.FC<AuditLogProps> = ({ logs, onOpenGoogleDrive }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [subsystemFilter, setSubsystemFilter] = useState<SubsystemCategoryType>('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskCategoryType>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [copiedHash, setCopiedHash] = useState(false);

  // Advanced Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormatType>('CSV');
  const [exportScope, setExportScope] = useState<ExportScopeType>('FILTERED');
  const [selectedFields, setSelectedFields] = useState<ExportFieldConfig>(DEFAULT_FIELDS);
  const [copiedExport, setCopiedExport] = useState(false);
  const [exportToastMessage, setExportToastMessage] = useState<string | null>(null);

  // Status mapping helper
  const isSuccess = (status: AuditLog['status']) => status === 'SUCCESS' || status === 'APPROVED';
  const isFailure = (status: AuditLog['status']) => status === 'FAILED' || status === 'BLOCKED' || status === 'REJECTED';
  const isPending = (status: AuditLog['status']) => status === 'PENDING';

  // Real-time metric counts across categories
  const counts = useMemo(() => {
    return {
      all: logs.length,
      success: logs.filter((l) => l.status === 'SUCCESS' || l.status === 'APPROVED').length,
      failed: logs.filter((l) => l.status === 'FAILED').length,
      blocked: logs.filter((l) => l.status === 'BLOCKED').length,
      pending: logs.filter((l) => l.status === 'PENDING').length,
      rejected: logs.filter((l) => l.status === 'REJECTED').length,
      // Subsystems
      local: logs.filter((l) => l.provider === 'local_agent').length,
      mcp: logs.filter((l) => l.provider.includes('mcp') || l.provider === 'brave_search').length,
      cloud: logs.filter((l) => ['slack', 'github', 'notion', 'linear', 'gmail'].includes(l.provider)).length,
      // Risk Levels
      safe: logs.filter((l) => l.riskLevel === 'safe').length,
      elevated: logs.filter((l) => l.riskLevel === 'elevated').length,
      critical: logs.filter((l) => l.riskLevel === 'critical').length,
      failure: logs.filter((l) => l.status === 'FAILED' || l.status === 'BLOCKED' || l.status === 'REJECTED').length,
    };
  }, [logs]);

  // Filter logs based on search, status category, subsystem category, risk category, and date
  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((log) => {
      // 1. Status Category filter
      if (statusFilter === 'SUCCESS' && log.status !== 'SUCCESS' && log.status !== 'APPROVED') {
        return false;
      }
      if (statusFilter === 'FAILED' && log.status !== 'FAILED') {
        return false;
      }
      if (statusFilter === 'BLOCKED' && log.status !== 'BLOCKED') {
        return false;
      }
      if (statusFilter === 'PENDING' && log.status !== 'PENDING') {
        return false;
      }
      if (statusFilter === 'REJECTED' && log.status !== 'REJECTED') {
        return false;
      }

      // 2. Subsystem Category filter
      if (subsystemFilter === 'LOCAL' && log.provider !== 'local_agent') {
        return false;
      }
      if (subsystemFilter === 'MCP' && !log.provider.includes('mcp') && log.provider !== 'brave_search') {
        return false;
      }
      if (subsystemFilter === 'CLOUD' && !['slack', 'github', 'notion', 'linear', 'gmail'].includes(log.provider)) {
        return false;
      }
      if (subsystemFilter === 'SYSTEM' && log.provider !== 'system') {
        return false;
      }

      // 3. Risk Category filter
      if (riskFilter === 'SAFE' && log.riskLevel !== 'safe') {
        return false;
      }
      if (riskFilter === 'ELEVATED' && log.riskLevel !== 'elevated') {
        return false;
      }
      if (riskFilter === 'CRITICAL' && log.riskLevel !== 'critical') {
        return false;
      }

      // 4. Date filtering from Activity Over Time chart click
      if (selectedDateFilter && !log.timestamp.startsWith(selectedDateFilter)) {
        return false;
      }

      // 5. Text query filtering
      if (!q) return true;

      const searchableText = [
        log.id,
        log.tool,
        log.provider,
        log.modelUsed,
        log.payloadHash,
        log.event,
        log.argumentsDigest,
        log.user,
        log.errorDetails,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(q);
    });
  }, [logs, search, statusFilter, subsystemFilter, riskFilter, selectedDateFilter]);

  // Summary statistics for currently filtered items
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    if (total === 0) return { avgLatency: 0, successRate: 0 };

    const totalLatency = filteredLogs.reduce((sum, l) => sum + (l.latencyMs || 0), 0);
    const successItems = filteredLogs.filter((l) => isSuccess(l.status)).length;

    return {
      avgLatency: Math.round(totalLatency / total),
      successRate: Math.round((successItems / total) * 100),
    };
  }, [filteredLogs]);

  // Helper to determine target dataset based on chosen scope
  const getLogsForScope = (scope: ExportScopeType): AuditLog[] => {
    if (scope === 'ALL') return logs;
    if (scope === 'FAILURES') return logs.filter((l) => isFailure(l.status));
    return filteredLogs;
  };

  // Generate Export String representation based on format, scope, and selected fields
  const generateExportData = (
    format: ExportFormatType,
    scope: ExportScopeType,
    fields: ExportFieldConfig
  ): { content: string; filename: string; mimeType: string; count: number } => {
    const targetLogs = getLogsForScope(scope);
    const dateStr = new Date().toISOString().slice(0, 10);
    const scopeTag = scope.toLowerCase();

    // 1. CSV Format
    if (format === 'CSV') {
      const fieldKeys: Array<keyof ExportFieldConfig> = [
        'id',
        'timestamp',
        'event',
        'modelUsed',
        'tool',
        'provider',
        'status',
        'riskLevel',
        'payloadHash',
        'latencyMs',
        'user',
        'argumentsDigest',
        'errorDetails',
      ];

      const activeKeys = fieldKeys.filter((k) => fields[k]);
      const headerRow = activeKeys.map((k) => `"${k}"`).join(',');

      const rows = targetLogs.map((log) => {
        return activeKeys
          .map((k) => {
            const rawVal = log[k as keyof AuditLog];
            if (rawVal === undefined || rawVal === null) return '""';
            const strVal = String(rawVal).replace(/"/g, '""');
            return `"${strVal}"`;
          })
          .join(',');
      });

      // Include UTF-8 BOM (\uFEFF) for Excel compatibility
      const content = '\uFEFF' + [headerRow, ...rows].join('\n');
      return {
        content,
        filename: `omniflow_audit_ledger_${scopeTag}_${dateStr}.csv`,
        mimeType: 'text/csv;charset=utf-8;',
        count: targetLogs.length,
      };
    }

    // 2. JSONL / NDJSON Format
    if (format === 'JSONL') {
      const lines = targetLogs.map((log) => {
        const item: Record<string, any> = {};
        Object.entries(fields).forEach(([k, enabled]) => {
          if (enabled) {
            item[k] = log[k as keyof AuditLog];
          }
        });
        return JSON.stringify(item);
      });

      return {
        content: lines.join('\n'),
        filename: `omniflow_audit_ledger_${scopeTag}_${dateStr}.jsonl`,
        mimeType: 'application/x-ndjson;charset=utf-8;',
        count: targetLogs.length,
      };
    }

    // 3. JSON Formatted or Minified
    const projectedLogs = targetLogs.map((log) => {
      const item: Record<string, any> = {};
      Object.entries(fields).forEach(([k, enabled]) => {
        if (enabled) {
          item[k] = log[k as keyof AuditLog];
        }
      });
      return item;
    });

    const isPretty = format === 'JSON_PRETTY';
    const content = isPretty
      ? JSON.stringify(projectedLogs, null, 2)
      : JSON.stringify(projectedLogs);

    return {
      content,
      filename: `omniflow_audit_ledger_${scopeTag}_${dateStr}.json`,
      mimeType: 'application/json;charset=utf-8;',
      count: targetLogs.length,
    };
  };

  // Direct trigger download helper
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up blob URL to prevent memory leaks
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // Quick 1-Click CSV Export (filtered view)
  const quickExportCSV = () => {
    const { content, filename, mimeType, count } = generateExportData(
      'CSV',
      'FILTERED',
      DEFAULT_FIELDS
    );
    triggerDownload(content, filename, mimeType);
    showToast(`Exported ${count} record(s) to ${filename}`);
  };

  // Quick 1-Click JSON Export (filtered view)
  const quickExportJSON = () => {
    const { content, filename, mimeType, count } = generateExportData(
      'JSON_PRETTY',
      'FILTERED',
      DEFAULT_FIELDS
    );
    triggerDownload(content, filename, mimeType);
    showToast(`Exported ${count} record(s) to ${filename}`);
  };

  // Modal Download
  const handleModalDownload = () => {
    const { content, filename, mimeType, count } = generateExportData(
      exportFormat,
      exportScope,
      selectedFields
    );
    triggerDownload(content, filename, mimeType);
    showToast(`Exported ${count} record(s) to ${filename}`);
    setIsExportModalOpen(false);
  };

  // Modal Copy to Clipboard
  const handleModalCopy = () => {
    const { content, count } = generateExportData(exportFormat, exportScope, selectedFields);
    navigator.clipboard.writeText(content);
    setCopiedExport(true);
    showToast(`Copied ${count} record(s) to clipboard`);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const showToast = (msg: string) => {
    setExportToastMessage(msg);
    setTimeout(() => setExportToastMessage(null), 4000);
  };

  // Toggle expandable log row
  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedLogIds(new Set(filteredLogs.map((l) => l.id)));
  };

  const collapseAll = () => {
    setExpandedLogIds(new Set());
  };

  // Toggle field selection
  const toggleField = (key: keyof ExportFieldConfig) => {
    setSelectedFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAllFields = (val: boolean) => {
    setSelectedFields({
      id: val,
      timestamp: val,
      event: val,
      tool: val,
      provider: val,
      modelUsed: val,
      status: val,
      riskLevel: val,
      latencyMs: val,
      user: val,
      payloadHash: val,
      argumentsDigest: val,
      errorDetails: val,
    });
  };

  // Preview computation for modal
  const exportPreview = useMemo(() => {
    if (!isExportModalOpen) return { previewText: '', count: 0, sizeKb: 0 };
    const { content, count } = generateExportData(exportFormat, exportScope, selectedFields);
    const sizeKb = Number((new Blob([content]).size / 1024).toFixed(1));
    const lines = content.split('\n');
    const previewText = lines.slice(0, 16).join('\n') + (lines.length > 16 ? '\n... (truncated preview)' : '');
    return { previewText, count, sizeKb };
  }, [isExportModalOpen, exportFormat, exportScope, selectedFields, filteredLogs, logs]);

  const getStatusBadge = (status: AuditLog['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>SUCCESS</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-indigo-500" />
            <span>APPROVED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/80 shadow-2xs">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>FAILED</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/80 shadow-2xs">
            <ShieldAlert className="w-3 h-3 text-rose-500" />
            <span>BLOCKED</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/80 shadow-2xs">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>REJECTED</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/80 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
            <span>PENDING</span>
          </span>
        );
      default:
        return <span className="text-[11px] font-mono text-slate-500">{status}</span>;
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1800);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Toast Notification Banner */}
      {exportToastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 dark:border-slate-300 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{exportToastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <ScrollText className="w-4 h-4" />
            <span>Cryptographic Security Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Universal Audit Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Tamper-evident record of every model invocation, prompt hash, tool execution, and approval decision with granular export to CSV, JSON, and JSONL.
          </p>
        </div>

        {/* Action Button Cluster */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Quick CSV */}
          <button
            onClick={quickExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            title="Download filtered records as CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Quick JSON */}
          <button
            onClick={quickExportJSON}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            title="Download filtered records as formatted JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Export JSON</span>
          </button>

          {/* Advanced Export Configurator */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg transition-all flex items-center gap-1.5 shadow-xs shadow-indigo-500/20"
            title="Configure custom export format, field columns, and scope"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Export Options...</span>
          </button>

          {/* Backup to Google Drive */}
          {onOpenGoogleDrive && (
            <button
              onClick={onOpenGoogleDrive}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Upload project snapshot and audit ledger to Google Drive"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Backup to Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar with Status Segmented Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tool, provider, model, SHA-256 hash, or event payload..."
              className="w-full text-xs sm:text-[13px] pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Primary Status Category Segmented Controls (Success, Failed, Blocked, Pending, Rejected, All) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200/70 dark:border-slate-800/80 overflow-x-auto select-none shrink-0">
            {/* All Statuses Filter */}
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>All Statuses</span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-slate-200/60 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                {counts.all}
              </span>
            </button>

            {/* Success Filter */}
            <button
              onClick={() => setStatusFilter('SUCCESS')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'SUCCESS'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Success</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${
                  statusFilter === 'SUCCESS'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'bg-slate-200/60 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                {counts.success}
              </span>
            </button>

            {/* Failed Filter */}
            <button
              onClick={() => setStatusFilter('FAILED')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'FAILED'
                  ? 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Failed</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${
                  statusFilter === 'FAILED'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold'
                    : 'bg-slate-200/60 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                {counts.failed}
              </span>
            </button>

            {/* Blocked Filter */}
            <button
              onClick={() => setStatusFilter('BLOCKED')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'BLOCKED'
                  ? 'bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Blocked</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${
                  statusFilter === 'BLOCKED'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold'
                    : 'bg-slate-200/60 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                {counts.blocked}
              </span>
            </button>

            {/* Pending Filter */}
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'PENDING'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold'
                    : 'bg-slate-200/60 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                {counts.pending}
              </span>
            </button>

            {/* Rejected Filter */}
            {counts.rejected > 0 && (
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === 'REJECTED'
                    ? 'bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-red-600'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>Rejected</span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-slate-200/60 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                  {counts.rejected}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary Category Dimensions (Subsystems & Risk Levels) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Subsystem Category Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Subsystem:</span>
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900/80 rounded-lg border border-slate-200/60 dark:border-slate-800/70 text-[11px]">
              <button
                onClick={() => setSubsystemFilter('ALL')}
                className={`px-2 py-1 rounded transition-colors ${
                  subsystemFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSubsystemFilter('LOCAL')}
                className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                  subsystemFilter === 'LOCAL'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <HardDrive className="w-3 h-3 text-slate-400" />
                <span>Local ({counts.local})</span>
              </button>
              <button
                onClick={() => setSubsystemFilter('MCP')}
                className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                  subsystemFilter === 'MCP'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Radio className="w-3 h-3 text-slate-400" />
                <span>MCP ({counts.mcp})</span>
              </button>
              <button
                onClick={() => setSubsystemFilter('CLOUD')}
                className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                  subsystemFilter === 'CLOUD'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Cloud className="w-3 h-3 text-slate-400" />
                <span>Cloud ({counts.cloud})</span>
              </button>
            </div>
          </div>

          {/* Risk Level Category Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Risk:</span>
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900/80 rounded-lg border border-slate-200/60 dark:border-slate-800/70 text-[11px]">
              <button
                onClick={() => setRiskFilter('ALL')}
                className={`px-2 py-1 rounded transition-colors ${
                  riskFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRiskFilter('SAFE')}
                className={`px-2 py-1 rounded transition-colors text-emerald-600 dark:text-emerald-400 ${
                  riskFilter === 'SAFE'
                    ? 'bg-white dark:bg-slate-800 font-semibold shadow-2xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Safe ({counts.safe})
              </button>
              <button
                onClick={() => setRiskFilter('ELEVATED')}
                className={`px-2 py-1 rounded transition-colors text-amber-600 dark:text-amber-400 ${
                  riskFilter === 'ELEVATED'
                    ? 'bg-white dark:bg-slate-800 font-semibold shadow-2xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Elevated ({counts.elevated})
              </button>
              <button
                onClick={() => setRiskFilter('CRITICAL')}
                className={`px-2 py-1 rounded transition-colors text-rose-600 dark:text-rose-400 ${
                  riskFilter === 'CRITICAL'
                    ? 'bg-white dark:bg-slate-800 font-semibold shadow-2xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Critical ({counts.critical})
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Strip for Active Filter Tags */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{filteredLogs.length}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{logs.length}</strong> operations
            </span>

            {/* Active Status Filter Chip */}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800/80">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-indigo-900 ml-0.5" title="Clear status filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Active Subsystem Filter Chip */}
            {subsystemFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800/80">
                Subsystem: {subsystemFilter}
                <button onClick={() => setSubsystemFilter('ALL')} className="hover:text-indigo-900 ml-0.5" title="Clear subsystem filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Active Risk Filter Chip */}
            {riskFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800/80">
                Risk: {riskFilter}
                <button onClick={() => setRiskFilter('ALL')} className="hover:text-indigo-900 ml-0.5" title="Clear risk filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Active Date Filter Chip */}
            {selectedDateFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800/80">
                Date: {selectedDateFilter}
                <button onClick={() => setSelectedDateFilter(null)} className="hover:text-indigo-900 ml-0.5" title="Clear date filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Active Search Query Chip */}
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                Query: &ldquo;{search}&rdquo;
                <button onClick={() => setSearch('')} className="hover:text-slate-900 ml-0.5" title="Clear search query">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Reset All Quick Link */}
            {(statusFilter !== 'ALL' || subsystemFilter !== 'ALL' || riskFilter !== 'ALL' || selectedDateFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setSubsystemFilter('ALL');
                  setRiskFilter('ALL');
                  setSelectedDateFilter(null);
                  setSearch('');
                }}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
              >
                Reset All
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums">
            <span className="flex items-center gap-1">
              <span className="text-slate-400 font-sans">Success Rate:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.successRate}%</strong>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400 font-sans">Avg Latency:</span>
              <strong className="text-slate-800 dark:text-slate-200">{stats.avgLatency}ms</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Activity Over Time Recharts Line & Area Chart */}
      <AuditActivityChart
        logs={logs}
        selectedDateFilter={selectedDateFilter}
        onSelectDateFilter={setSelectedDateFilter}
      />

      {/* Audit Table */}
      <div className="bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                No logs match your current filter
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No operation records match your selected status, subsystem, or risk filters
                {selectedDateFilter ? ` on date ${selectedDateFilter}` : ''}
                {search ? ` and query "${search}"` : ''}.
              </p>
            </div>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSubsystemFilter('ALL');
                setRiskFilter('ALL');
                setSelectedDateFilter(null);
                setSearch('');
              }}
              className="px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 font-semibold text-slate-500 dark:text-slate-400 select-none">
                <tr>
                  <th className="py-3 pl-3 pr-1 w-10 text-center">
                    <button
                      type="button"
                      onClick={expandedLogIds.size === filteredLogs.length ? collapseAll : expandAll}
                      title={
                        expandedLogIds.size === filteredLogs.length
                          ? 'Collapse all rows'
                          : 'Expand all rows to view request/response & stack traces'
                      }
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-4">Event & Tool</th>
                  <th className="py-3 px-4">Model Used</th>
                  <th className="py-3 px-4">Payload Hash</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Latency</th>
                  <th className="py-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogIds.has(log.id);
                  const hasFault = Boolean(log.errorDetails || log.errorStackTrace || log.status === 'FAILED' || log.status === 'BLOCKED' || log.status === 'REJECTED');

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`transition-colors group cursor-pointer ${
                          isExpanded
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                            : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                        }`}
                        onClick={() => toggleExpand(log.id)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleExpand(log.id);
                          }
                        }}
                      >
                        {/* Expand Chevron Cell */}
                        <td className="py-3 pl-3 pr-1 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(log.id);
                            }}
                            className={`p-1 rounded transition-transform ${
                              isExpanded
                                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-900/50'
                                : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                            }`}
                            aria-label={isExpanded ? 'Collapse log details' : 'Expand log details'}
                          >
                            <ChevronRight
                              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                isExpanded ? 'rotate-90 text-indigo-600 dark:text-indigo-400' : ''
                              }`}
                            />
                          </button>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {log.timestamp}
                        </td>

                        {/* Event & Tool */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{log.tool}</span>
                            {hasFault && (
                              <span
                                title={log.errorDetails || 'Runtime error reported'}
                                className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse"
                              />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                            {log.event} · {log.provider}
                          </div>
                        </td>

                        {/* Model Used */}
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {log.modelUsed}
                        </td>

                        {/* Payload Hash */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                            {log.payloadHash.slice(0, 16)}...
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(log.status)}</td>

                        {/* Latency */}
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                          {log.latencyMs}ms
                        </td>

                        {/* Actions */}
                        <td className="py-3 pr-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Open in full inspector dialog"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Panel Child Row */}
                      {isExpanded && (
                        <tr key={`${log.id}-expanded`} className="border-b border-indigo-100 dark:border-indigo-950/60 bg-transparent">
                          <td colSpan={8} className="p-0">
                            <AuditLogExpandedDetail
                              log={log}
                              onOpenInspectorModal={() => setSelectedLog(log)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advanced Export Configurator Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Export Audit History
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Download activity logs for compliance, external SIEM, or spreadsheet analysis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scope & Format Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Format Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Export File Format
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setExportFormat('CSV')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      exportFormat === 'CSV'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="text-left">
                      <div>CSV Spreadsheet</div>
                      <div className="text-[10px] font-normal opacity-75">Excel & Sheets</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('JSON_PRETTY')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      exportFormat === 'JSON_PRETTY'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="text-left">
                      <div>JSON (Pretty)</div>
                      <div className="text-[10px] font-normal opacity-75">Indented 2-space</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('JSONL')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      exportFormat === 'JSONL'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="text-left">
                      <div>JSONL / NDJSON</div>
                      <div className="text-[10px] font-normal opacity-75">Splunk / Datadog</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('JSON_MINIFIED')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      exportFormat === 'JSON_MINIFIED'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileCode className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="text-left">
                      <div>JSON (Minified)</div>
                      <div className="text-[10px] font-normal opacity-75">Compact size</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Scope Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Record Dataset Scope
                </label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'FILTERED'}
                      onChange={() => setExportScope('FILTERED')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>Current Filtered View</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {filteredLogs.length} records
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Applies current status filter ({statusFilter}) and active search term
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'ALL'}
                      onChange={() => setExportScope('ALL')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>All Ledger Records</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {logs.length} records
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Complete historical activity log from storage
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'FAILURES'}
                      onChange={() => setExportScope('FAILURES')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>Failures & Policy Blocks Only</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold">
                          {counts.failure} records
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Targeted for anomaly investigation & security reporting
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Field / Column Customizer */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Include Columns & Properties</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({Object.values(selectedFields).filter(Boolean).length}/13 selected)
                  </span>
                </label>

                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => selectAllFields(true)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() => selectAllFields(false)}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(
                  [
                    ['timestamp', 'Timestamp'],
                    ['event', 'Event Name'],
                    ['tool', 'Tool Name'],
                    ['provider', 'Provider'],
                    ['modelUsed', 'Model Used'],
                    ['status', 'Status'],
                    ['riskLevel', 'Risk Level'],
                    ['latencyMs', 'Latency (ms)'],
                    ['user', 'Operator/User'],
                    ['payloadHash', 'SHA-256 Hash'],
                    ['argumentsDigest', 'Arguments'],
                    ['errorDetails', 'Error Details'],
                    ['id', 'Unique ID'],
                  ] as Array<[keyof ExportFieldConfig, string]>
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields[key]}
                      onChange={() => toggleField(key)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Live Data Preview */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Data Stream Preview
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {exportPreview.count} entries · ~{exportPreview.sizeKb} KB
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[10px] leading-relaxed max-h-32 overflow-auto border border-slate-800 select-all">
                {exportPreview.previewText || '(No records in selected scope)'}
              </pre>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleModalCopy}
                disabled={exportPreview.count === 0}
                className="px-3.5 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 font-medium disabled:opacity-50"
              >
                {copiedExport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-3.5 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleModalDownload}
                  disabled={exportPreview.count === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {exportFormat === 'CSV' ? '.csv' : exportFormat === 'JSONL' ? '.jsonl' : '.json'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-indigo-500" />
                <span>Audit Ledger Entry Details</span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 font-sans">Timestamp: </span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Operator: </span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedLog.user}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Model: </span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedLog.modelUsed}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Latency: </span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedLog.latencyMs}ms</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Tool: </span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedLog.tool}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-sans">Status: </span>
                  <div>{getStatusBadge(selectedLog.status)}</div>
                </div>
              </div>

              {/* Error Details (if failed or blocked) */}
              {selectedLog.errorDetails && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1">
                  <div className="font-sans font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Failure Rationale & Policy Violation</span>
                  </div>
                  <div className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed font-sans">
                    {selectedLog.errorDetails}
                  </div>
                </div>
              )}

              {/* Arguments Digest */}
              <div>
                <div className="text-slate-500 font-sans font-semibold mb-1">
                  Arguments Digest:
                </div>
                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] whitespace-pre-wrap leading-relaxed">
                  {selectedLog.argumentsDigest}
                </div>
              </div>

              {/* Cryptographic SHA-256 Payload Hash with copy */}
              <div>
                <div className="text-slate-500 font-sans font-semibold mb-1 flex items-center justify-between">
                  <span>Cryptographic Payload Hash:</span>
                  <button
                    onClick={() => copyHash(selectedLog.payloadHash)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] border border-slate-200 dark:border-slate-800 break-all">
                  sha256:{selectedLog.payloadHash}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
