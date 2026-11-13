import React, { useState } from 'react';
import {
  Radio,
  FileText,
  Mail,
  HardDrive,
  MessageSquare,
  GitPullRequest,
  Search,
  Folder,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Plus,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Layers,
  X,
  Cloud,
} from 'lucide-react';
import { Connection, ConnectionCategory, RiskLevel } from '../types';

interface ConnectorRegistryProps {
  connections: Connection[];
  onTestConnection: (id: string) => Promise<void>;
  onToggleConnection: (id: string, enabled: boolean) => void;
  onAddConnection: (conn: Connection) => void;
  onOpenGoogleDrive?: () => void;
}

export const ConnectorRegistry: React.FC<ConnectorRegistryProps> = ({
  connections,
  onTestConnection,
  onToggleConnection,
  onAddConnection,
  onOpenGoogleDrive,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | ConnectionCategory>('all');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Connector form state
  const [newName, setNewName] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newCategory, setNewCategory] = useState<ConnectionCategory>('mcp');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newScopes, setNewScopes] = useState('');
  const [newRisk, setNewRisk] = useState<RiskLevel>('safe');

  const filteredConnections = connections.filter((c) => {
    if (activeCategory === 'all') return true;
    return c.category === activeCategory;
  });

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await onTestConnection(id);
    } finally {
      setTestingId(null);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEndpoint.trim()) return;

    const created: Connection = {
      id: `conn-${Date.now().toString(36)}`,
      name: newName,
      provider: newProvider || newName.toLowerCase().replace(/\s+/g, '_'),
      category: newCategory,
      status: 'connected',
      scopes: newScopes ? newScopes.split(',').map((s) => s.trim()) : ['read:standard'],
      riskLevel: newRisk,
      endpoint: newEndpoint,
      description: 'Custom registered connector via OmniFlow gateway.',
      icon: newCategory === 'mcp' ? 'Layers' : 'Radio',
      lastTestedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      latencyMs: 45,
      isEnabled: true,
      version: '1.0.0',
    };

    onAddConnection(created);
    setShowAddModal(false);
    setNewName('');
    setNewEndpoint('');
    setNewScopes('');
  };

  const getIcon = (provider: string) => {
    switch (provider) {
      case 'notion':
        return <FileText className="w-5 h-5 text-emerald-500" />;
      case 'gmail':
        return <Mail className="w-5 h-5 text-rose-500" />;
      case 'google_drive':
        return <HardDrive className="w-5 h-5 text-blue-500" />;
      case 'slack':
        return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'github':
        return <GitPullRequest className="w-5 h-5 text-purple-500" />;
      case 'brave_search':
        return <Search className="w-5 h-5 text-orange-500" />;
      case 'filesystem_mcp':
        return <Folder className="w-5 h-5 text-amber-500" />;
      case 'postgres_mcp':
        return <Database className="w-5 h-5 text-cyan-500" />;
      default:
        return <Radio className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Radio className="w-4 h-4" />
            <span>Standardized Tool Layer</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Connector & MCP Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standardize access to cloud APIs, Model Context Protocol (MCP) servers, and local daemons with granular scopes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Connector / MCP</span>
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          All Connectors ({connections.length})
        </button>
        <button
          onClick={() => setActiveCategory('cloud')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'cloud'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Cloud APIs
        </button>
        <button
          onClick={() => setActiveCategory('mcp')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'mcp'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          MCP Protocol Servers
        </button>
        <button
          onClick={() => setActiveCategory('local')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'local'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Local Device Agents
        </button>
      </div>

      {/* Grid of Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConnections.map((conn) => {
          const isTesting = testingId === conn.id;

          return (
            <div
              key={conn.id}
              className={`p-5 rounded-2xl border bg-white/80 dark:bg-[#0c121e]/80 backdrop-blur-xl shadow-xs flex flex-col justify-between transition-all ${
                conn.isEnabled
                  ? 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'border-slate-200/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="space-y-3">
                {/* Top card row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80">
                      {getIcon(conn.provider)}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {conn.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 font-mono">
                        <span>{conn.category.toUpperCase()}</span>
                        {conn.version && <span>· {conn.version}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={conn.isEnabled}
                      onChange={(e) => onToggleConnection(conn.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {conn.description}
                </p>

                {/* Endpoint & Scopes */}
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="text-slate-500 truncate">
                    Endpoint: <span className="text-slate-800 dark:text-slate-200">{conn.endpoint}</span>
                  </div>
                  <div className="text-slate-500 truncate">
                    Scopes: <span className="text-slate-800 dark:text-slate-200">{conn.scopes.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Telemetry & Test Action */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      conn.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {conn.status === 'connected' ? `${conn.latencyMs}ms` : 'Offline'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {conn.provider === 'google_drive' && onOpenGoogleDrive && (
                    <button
                      onClick={onOpenGoogleDrive}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                    >
                      <Cloud className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>Upload Project</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleTest(conn.id)}
                    disabled={isTesting}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <RotateCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing...' : 'Test'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Connector Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Register New Tool or MCP Server
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add a Model Context Protocol (MCP) server or cloud API endpoint to your OmniFlow gateway.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Connector Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Linear Issue Tracker MCP"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Connector Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ConnectionCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="mcp">MCP Standard Server</option>
                    <option value="cloud">Cloud API (OAuth)</option>
                    <option value="local">Local Workstation Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Risk Level
                  </label>
                  <select
                    value={newRisk}
                    onChange={(e) => setNewRisk(e.target.value as RiskLevel)}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="safe">Safe (Read-Only)</option>
                    <option value="elevated">Elevated (Requires Approval)</option>
                    <option value="critical">Critical (Strict Approval + 2FA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Server Endpoint URI
                </label>
                <input
                  type="text"
                  required
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  placeholder="e.g. mcp://linear.internal:9095 or https://api.linear.app"
                  className="w-full font-mono bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Allowed Scopes (comma separated)
                </label>
                <input
                  type="text"
                  value={newScopes}
                  onChange={(e) => setNewScopes(e.target.value)}
                  placeholder="e.g. issues:read, issues:create"
                  className="w-full font-mono bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
              >
                Register Connector
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
