import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  Github,
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Download,
  Lock,
  Globe,
  Key,
  FolderGit2,
  Terminal,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GitHubUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubUploadModal: React.FC<GitHubUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [token, setToken] = useState('');
  const [repoName, setRepoName] = useState('omniflow-control-center');
  const [description, setDescription] = useState('OmniFlow - AI Developer Control Center & Standardized Tool Layer');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    repoUrl: string;
    username: string;
    repoName: string;
    message: string;
  } | null>(null);

  const [copiedCmd, setCopiedCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<'token' | 'zip' | 'cli'>('token');
  const [gitStatus, setGitStatus] = useState<{
    commitHash?: string;
    commitCount?: number;
    branch?: string;
  }>({});

  // Fetch git status on modal open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetch('/api/github/status')
        .then((r) => {
          const isJson = r.headers.get('content-type')?.includes('application/json');
          return r.ok && isJson ? r.json() : null;
        })
        .then((data) => {
          if (data && data.initialized) {
            setGitStatus(data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please provide a GitHub Personal Access Token to upload to your account.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/github/push-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          repoName: repoName.trim() || 'omniflow-control-center',
          description: description.trim(),
          isPrivate,
        }),
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (!isJson) {
        throw new Error('Upload proxy endpoint unavailable. Use the Download ZIP tab or Manual CLI tab to push your code.');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload repository to GitHub');
      }

      setResult({
        repoUrl: data.repoUrl,
        username: data.username,
        repoName: data.repoName,
        message: data.message,
      });
    } catch (err: any) {
      setError(err.message || 'Error uploading to GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  const cliSnippet = `# 1. Add your GitHub remote repository
git remote add origin https://github.com/tusharsolanki9845-dev/${repoName}.git

# 2. Set main branch & push code
git branch -M main
git push -u origin main`;

  const copyCli = () => {
    navigator.clipboard.writeText(cliSnippet);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-2xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col overflow-hidden z-10 max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-sm">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Upload OmniFlow to GitHub</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                    Git Ready ({gitStatus.commitHash || 'v1.2'})
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Target Account: <strong className="text-slate-700 dark:text-slate-300">@tusharsolanki9845-dev</strong> (tusharsolanki9845@gmail.com)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader Navigation: 1-Click Upload / ZIP Archive / CLI Guide */}
          <div className="flex items-center gap-1 p-2 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 text-xs">
            <button
              onClick={() => setActiveTab('token')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'token'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>1-Click GitHub Push</span>
            </button>

            <button
              onClick={() => setActiveTab('zip')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'zip'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP Archive</span>
            </button>

            <button
              onClick={() => setActiveTab('cli')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'cli'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Manual CLI Commands</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            {result ? (
              /* Success State */
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Repository Successfully Uploaded to GitHub!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    All 53 source files, PWA manifests, icons, and server integrations have been pushed to branch{' '}
                    <code className="font-mono text-emerald-600 dark:text-emerald-400">main</code>.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto text-xs font-mono break-all text-slate-800 dark:text-slate-200">
                  {result.repoUrl}
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <a
                    href={result.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-semibold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
                  >
                    <span>View Repository on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setResult(null)}
                    className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            ) : activeTab === 'token' ? (
              /* 1-Click Upload Tab */
              <form onSubmit={handleUpload} className="space-y-4 text-xs">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{error}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Repository Name
                    </label>
                    <input
                      type="text"
                      required
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      placeholder="e.g. omniflow-control-center"
                      className="w-full font-mono bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Repository Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPrivate(false)}
                        className={`p-2.5 rounded-xl border text-center font-medium flex items-center justify-center gap-1.5 transition-all ${
                          !isPrivate
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Public</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPrivate(true)}
                        className={`p-2.5 rounded-xl border text-center font-medium flex items-center justify-center gap-1.5 transition-all ${
                          isPrivate
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Private</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Repository Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description for GitHub"
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-500" />
                      <span>GitHub Personal Access Token (PAT)</span>
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=OmniFlow-Direct-Upload"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Generate token on GitHub (1-click)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full font-mono bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Requires <code className="font-mono text-indigo-500">repo</code> scope. Used solely for this push request and never stored.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Branch: main · {gitStatus.commitCount || 1} commit
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !token.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm shadow-indigo-500/25 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Pushing to GitHub...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Create & Push Repository</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : activeTab === 'zip' ? (
              /* ZIP Download Tab */
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4 text-indigo-500" />
                    <span>Download Complete Source Archive (.zip)</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                    Download a clean, production-ready ZIP archive of the complete OmniFlow codebase (including all React components, Express server, PWA assets, and icons). You can drag and drop it into GitHub or extract it anywhere.
                  </p>

                  <div className="pt-2">
                    <a
                      href="/omniflow-source-v1.2.zip"
                      download="omniflow-source-v1.2.zip"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-sm transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download omniflow-source-v1.2.zip (190 KB)</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-500">
                  <p><strong>To import into GitHub manually:</strong></p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Download the ZIP archive above and extract it on your computer.</li>
                    <li>Open <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">github.com/new</a> and create a repository named <code className="font-mono">omniflow</code>.</li>
                    <li>Run <code className="font-mono">git remote add origin ...</code> and <code className="font-mono">git push -u origin main</code> in the extracted folder.</li>
                  </ol>
                </div>
              </div>
            ) : (
              /* CLI Guide Tab */
              <div className="space-y-3 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  If you have the terminal or SSH keys set up for <strong className="text-slate-700 dark:text-slate-300">@tusharsolanki9845-dev</strong>, run these commands:
                </p>

                <div className="relative">
                  <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                    {cliSnippet}
                  </pre>
                  <button
                    onClick={copyCli}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-200">
                  The local Git repo is already initialized on branch <code className="font-mono font-bold">main</code> with a verified initial commit containing all 53 project files.
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#0a0e18]/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Github className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>GitHub API v3 Integration</span>
            </span>

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
