import React, { useState } from 'react';
import {
  Globe,
  Github,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Code2,
  Layers,
  FileText,
  AlertTriangle,
  RefreshCw,
  Send,
  Smartphone,
  Monitor,
  Tablet,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PortfolioEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStageChanges: (summary: string, diff: { before: any; after: any }) => void;
  onOpenApprovals: () => void;
}

type ViewMode = 'split' | 'preview_only' | 'editor_only';
type DevicePreset = 'desktop' | 'tablet' | 'mobile';

export const PortfolioEditorModal: React.FC<PortfolioEditorModalProps> = ({
  isOpen,
  onClose,
  onStageChanges,
  onOpenApprovals,
}) => {
  if (!isOpen) return null;

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [devicePreset, setDevicePreset] = useState<DevicePreset>('desktop');
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);

  const [headline, setHeadline] = useState('Tushar Solanki | Full-Stack Web Developer');
  const [bio, setBio] = useState(
    'B.Tech CSE (AI & ML) student • Freelance web developer • Building practical products with JavaScript, React, Node.js, Firebase, PWA & Vercel.'
  );
  const [featuredProjects, setFeaturedProjects] = useState([
    'Webclient Hunter AI (Zero-Cost Lead Discovery & Outreach Workspace)',
    'AI Duniya (Learning & Innovation Community Hub)',
    'AlphaTech Solutions (Website & Capacitor Android App)',
    'ProctorX (AI Exam Proctoring & Assessment Monitor)',
  ]);
  const [newProjectInput, setNewProjectInput] = useState('');
  const [skills, setSkills] = useState(
    'React 19, TypeScript, Node.js, Express, Tailwind CSS, Firebase, Model Context Protocol (MCP), Gemini API, Capacitor, PWA'
  );
  const [resumeUrl, setResumeUrl] = useState('https://tushar-portfolio-live.vercel.app/resume_tushar_solanki.pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const liveUrl = 'https://tushar-portfolio-live.vercel.app';

  const handleReloadIframe = () => {
    setIsIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleAddProject = () => {
    if (newProjectInput.trim()) {
      setFeaturedProjects([...featuredProjects, newProjectInput.trim()]);
      setNewProjectInput('');
    }
  };

  const handleRemoveProject = (index: number) => {
    setFeaturedProjects(featuredProjects.filter((_, i) => i !== index));
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 600));

    const codeSnippet = `// src/data/portfolioData.ts
// Auto-generated via OmniFlow Gateway for Tushar Solanki
export const PORTFOLIO_CONFIG = {
  name: "Tushar Solanki",
  title: "${headline}",
  bio: "${bio}",
  contact: {
    email: "tusharsolanki9845@gmail.com",
    github: "https://github.com/tusharsolanki9845-dev",
    linkedin: "https://www.linkedin.com/in/tushar-solanki-915048370",
    resumeUrl: "${resumeUrl}"
  },
  skills: [${skills.split(',').map((s) => `"${s.trim()}"`).join(', ')}],
  featuredProjects: [
    ${featuredProjects
      .map(
        (p) => `{
      title: "${p.replace(/"/g, '\\"')}",
      verified: true,
      lastUpdated: "${new Date().toISOString().substring(0, 10)}"
    }`
      )
      .join(',\n    ')}
  ]
};`;

    setGeneratedCode(codeSnippet);
    setIsGenerating(false);
  };

  const handleStageToGitHub = () => {
    if (!generatedCode) return;

    onStageChanges(
      'Update portfolio configuration with synchronized AI project showcase and verified skills',
      {
        before: '// Previous portfolio project list without latest 2026 AI builds',
        after: generatedCode,
      }
    );

    onClose();
    onOpenApprovals();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Live Portfolio Editor & GitHub Stager
                </h2>
                <span className="text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Vercel Active
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                <span>tushar-portfolio-live.vercel.app</span>
                <span>&rarr;</span>
                <span className="text-indigo-600 dark:text-indigo-400">tusharsolanki9845-dev/tushar-portfolio-vercel</span>
              </div>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode('preview_only')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'preview_only'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Live Preview
              </button>
              <button
                onClick={() => setViewMode('editor_only')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'editor_only'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Code & Content
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* LEFT: Live Website Embed View (Split or Preview Mode) */}
          {(viewMode === 'split' || viewMode === 'preview_only') && (
            <div
              className={`${
                viewMode === 'split' ? 'lg:col-span-6 border-r' : 'lg:col-span-12'
              } border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col min-h-0 overflow-hidden`}
            >
              {/* Browser chrome header */}
              <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>

                {/* URL Bar */}
                <div className="flex-1 max-w-sm mx-2 px-2.5 py-1 bg-slate-950 rounded-md text-[11px] font-mono text-slate-300 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">https://tushar-portfolio-live.vercel.app</span>
                  </div>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open live site in new window"
                    className="text-slate-400 hover:text-white"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Device presets & reload */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDevicePreset('desktop')}
                    className={`p-1 rounded ${
                      devicePreset === 'desktop' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Desktop (100%)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDevicePreset('tablet')}
                    className={`p-1 rounded ${
                      devicePreset === 'tablet' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Tablet (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDevicePreset('mobile')}
                    className={`p-1 rounded ${
                      devicePreset === 'mobile' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Mobile (390px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-3 bg-slate-800 mx-1" />

                  <button
                    onClick={handleReloadIframe}
                    className="p-1 text-slate-400 hover:text-white rounded"
                    title="Reload Live View"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Iframe container */}
              <div className="flex-1 bg-slate-900/50 flex items-center justify-center p-2 overflow-auto">
                <div
                  className={`h-full transition-all duration-300 bg-white rounded-lg shadow-xl overflow-hidden relative flex flex-col ${
                    devicePreset === 'desktop'
                      ? 'w-full'
                      : devicePreset === 'tablet'
                      ? 'w-[768px] max-w-full'
                      : 'w-[390px] max-w-full'
                  }`}
                >
                  {isIframeLoading && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-10 text-white text-xs gap-2 font-mono">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Loading live deployment...</span>
                    </div>
                  )}

                  <iframe
                    key={iframeKey}
                    src={liveUrl}
                    title="Tushar Portfolio Live"
                    className="w-full h-full border-none flex-1"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    onLoad={() => setIsIframeLoading(false)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: Editor and AI Staging Console */}
          {(viewMode === 'split' || viewMode === 'editor_only') && (
            <div
              className={`${
                viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
              } flex flex-col min-h-0 bg-white dark:bg-slate-900`}
            >
              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                {/* Notice callout */}
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Synchronized AI Staging
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Edits made here generate verified TypeScript config diffs for <code className="font-mono text-indigo-600 dark:text-indigo-300">src/data/portfolioData.ts</code> in your GitHub repo, routed directly to the Approval Queue before commit.
                    </p>
                  </div>
                </div>

                {/* Headline */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Portfolio Role Title / Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Professional Bio & Focus
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Technical Skills */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Verified Technical Skills (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Featured Projects */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Featured Projects ({featuredProjects.length})
                    </label>
                    <span className="text-[10px] text-slate-400">Syncs to Live Site</span>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                    {featuredProjects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate text-slate-800 dark:text-slate-200">{proj}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveProject(idx)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 rounded"
                          title="Remove from featured list"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center gap-2 pt-1.5">
                      <input
                        type="text"
                        placeholder="Add another project..."
                        value={newProjectInput}
                        onChange={(e) => setNewProjectInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200"
                      />
                      <button
                        onClick={handleAddProject}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-sans text-xs font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Generated Code Preview */}
                {generatedCode && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-indigo-500" />
                        <span>Generated TypeScript Patch</span>
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Ready to Stage
                      </span>
                    </div>
                    <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono max-h-48 overflow-y-auto leading-relaxed border border-slate-800">
                      {generatedCode}
                    </pre>
                  </div>
                )}
              </div>

              {/* Editor Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between gap-3 shrink-0">
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open live in new tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center gap-2">
                  {!generatedCode ? (
                    <button
                      onClick={handleGenerateCode}
                      disabled={isGenerating}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isGenerating ? 'Synthesizing Patch...' : 'Generate Code Diff'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStageToGitHub}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Stage to GitHub & Review in Queue &rarr;</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
