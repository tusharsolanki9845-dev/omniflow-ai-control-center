import React, { useState } from 'react';
import {
  FolderLock,
  HardDrive,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Terminal,
  ShieldCheck,
  Search,
  Eye,
  Clock,
  Cpu,
  Layers,
} from 'lucide-react';
import { LocalFile, LocalDeviceAgentConfig } from '../types';

interface LocalAgentProps {
  files: LocalFile[];
  agentConfig: LocalDeviceAgentConfig;
}

export const LocalAgentView: React.FC<LocalAgentProps> = ({ files, agentConfig }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<LocalFile | null>(files[0] || null);

  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.directory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('pdf')) return <FileText className="w-4 h-4 text-rose-500" />;
    if (mime.includes('sheet') || mime.includes('csv'))
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    return <FileText className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <FolderLock className="w-4 h-4" />
          <span>Local Device Agent & File Sandbox</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
          Workstation Local Agent
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Secure daemon running on your PC, reachable via authenticated WireGuard/Tailscale tunnel. Zero arbitrary shell access.
        </p>
      </div>

      {/* Agent Telemetry & Sandboxing Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Tunnel Status</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {agentConfig.tunnelEndpoint}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Port {agentConfig.port} (Loopback only)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Sandbox Boundary</div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict Enforced</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {agentConfig.allowedDirectories.length} Allowlisted Folders
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Workstation Usage</div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {agentConfig.cpuUsagePct}% CPU · {agentConfig.memoryUsageMb} MB
          </div>
          <div className="text-[11px] text-slate-400">Lightweight daemon</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Command Allowlist</div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
            {agentConfig.allowlistCommands.length} Commands
          </div>
          <div className="text-[11px] text-slate-400 truncate font-mono">
            {agentConfig.allowlistCommands.slice(0, 3).join(', ')}...
          </div>
        </div>
      </div>

      {/* Allowed Directories & Commands Spec Bar */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#0c121e]/60 border border-slate-200/80 dark:border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <Lock className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-slate-500 font-sans font-medium">Permitted Directories:</span>
          {agentConfig.allowedDirectories.map((dir, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {dir}
            </span>
          ))}
        </div>
        <div className="text-[11px] text-slate-500 font-sans">
          Signed Local Agent · v1.4.2 · SHA-256 Validated
        </div>
      </div>

      {/* Sandboxed File Explorer Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Files List */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search allowlisted files in ~/Downloads, ~/Documents..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500 tabular-nums font-mono shrink-0">
              {filteredFiles.length} files
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile?.path === file.path;
              return (
                <div
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`p-3.5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 shrink-0">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {file.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                        {file.directory}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0 font-mono tabular-nums text-slate-500">
                    <span>{formatBytes(file.sizeBytes)}</span>
                    <span className="hidden sm:inline">{file.modifiedAt}</span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-sans font-semibold rounded-md ${
                        file.permissions === 'read-only'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {file.permissions}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected File Metadata & Inspection */}
        <div className="bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Eye className="w-4 h-4 text-indigo-500" />
                <span>File Inspector & Extraction</span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 break-all">
                  {selectedFile.name}
                </h3>
                <div className="text-[11px] font-mono text-slate-400 break-all mt-0.5">
                  {selectedFile.path}
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Size:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {formatBytes(selectedFile.sizeBytes)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">MIME:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedFile.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Modified:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedFile.modifiedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Access:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
                    {selectedFile.permissions}
                  </span>
                </div>
              </div>

              {selectedFile.extractedSnippet && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Extracted Document Content
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto">
                    {selectedFile.extractedSnippet}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">
              Select a file to inspect metadata and extracted contents
            </div>
          )}

          <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
            Local daemon enforces read-only access by default. Deletion or file modification triggers approval requirement.
          </div>
        </div>
      </div>
    </div>
  );
};
