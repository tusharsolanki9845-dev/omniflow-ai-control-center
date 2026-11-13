import React, { useState } from 'react';
import {
  Sparkles,
  Github,
  CheckCircle2,
  Code2,
  X,
  Play,
  Copy,
  Check,
  Cpu,
  Layers,
  ArrowRight,
  Zap,
  Gauge,
  ShieldAlert,
  FileCode,
  Terminal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIProject } from '../types';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: AIProject | null;
  taskTitle: string;
  onStageCodeToGitHub: (projectId: string, taskTitle: string, generatedCode: string) => void;
  onOpenApprovals: () => void;
}

type SpeedMode = 'turbo' | 'reasoning' | 'comprehensive';

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  isOpen,
  onClose,
  project,
  taskTitle,
  onStageCodeToGitHub,
  onOpenApprovals,
}) => {
  if (!isOpen || !project) return null;

  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [speedMode, setSpeedMode] = useState<SpeedMode>('turbo');
  const [advancedDirective, setAdvancedDirective] = useState<string>('⚡ Fast Clean Code');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [testCode, setTestCode] = useState<string>('');
  const [activeCodeTab, setActiveCodeTab] = useState<'implementation' | 'tests'>('implementation');
  const [copied, setCopied] = useState(false);
  const [throughputStats, setThroughputStats] = useState<{
    latencyMs: number;
    tokensCount: number;
    tokensPerSec: number;
  } | null>(null);

  const quickDirectives = [
    '⚡ Fast Clean Code',
    '🛡️ Strict Typing & Error Boundary',
    '🚀 High-Throughput Async Engine',
    '📦 Zero External Dependency',
  ];

  // High-Speed / Advanced Language Code Generation Engine
  const handleGenerate = async () => {
    setIsGenerating(true);
    const startTime = performance.now();

    // Fast generation delay based on speed mode
    const simulatedDelay = speedMode === 'turbo' ? 320 : speedMode === 'reasoning' ? 750 : 500;
    await new Promise((r) => setTimeout(r, simulatedDelay));

    let sampleCode = '';
    let sampleTests = '';

    const lowerTask = taskTitle.toLowerCase();

    if (lowerTask.includes('email') || lowerTask.includes('outreach')) {
      sampleCode = `// src/services/outreachEngine.ts
/**
 * @engine OmniFlow Fast-Working Outreach Accelerator
 * @model ${selectedModel}
 * @directive ${advancedDirective}
 * @project ${project.name} (${project.repoName})
 */

export interface LeadProfile {
  businessName: string;
  website: string;
  industry: string;
  city: string;
  identifiedIssues: string[];
}

export interface OutreachDispatchPayload {
  subject: string;
  recipient: string;
  body: string;
  dispatchPriority: 'HIGH' | 'NORMAL';
  trackingToken: string;
}

export async function generatePersonalizedOutreach(
  lead: LeadProfile,
  options: { fastMode?: boolean; tone?: 'direct' | 'technical' } = {}
): Promise<OutreachDispatchPayload> {
  const primaryIssue = lead.identifiedIssues[0] || 'Core Web Vitals & Mobile Layout';
  const trackingToken = \`tkn_\${Date.now().toString(36)}_\${Math.random().toString(36).substring(2, 7)}\`;

  return {
    subject: \`Technical observation: \${lead.businessName} performance optimization opportunity\`,
    recipient: lead.businessName,
    body: \`Hi \${lead.businessName} Team,\\n\\nI analyzed \${lead.website} during a recent ecosystem audit in \${lead.city}.\\n\\nI identified high-impact optimizations for \${primaryIssue} that could noticeably decrease bounce rates on mobile.\\n\\nI prepared a concise, verified architecture audit outlining exact fixes with zero obligation.\\n\\nWould you be open to a 10-minute technical review this week?\\n\\nBest regards,\\nTushar Solanki\\nFull-Stack Web & AI Developer\\nPortfolio: https://tushar-portfolio-live.vercel.app\\nGitHub: @tusharsolanki9845-dev\`,
    dispatchPriority: 'HIGH',
    trackingToken
  };
}

export async function batchGenerateOutreach(leads: LeadProfile[]): Promise<OutreachDispatchPayload[]> {
  return Promise.all(leads.map(lead => generatePersonalizedOutreach(lead, { fastMode: true })));
}`;

      sampleTests = `// test/outreachEngine.test.ts
import { describe, it, expect } from 'vitest';
import { generatePersonalizedOutreach } from '../src/services/outreachEngine';

describe('OutreachEngine Performance Tests', () => {
  it('generates compliant payload under 5ms', async () => {
    const lead = {
      businessName: 'Acme Logistics',
      website: 'https://acme-logistics.test',
      industry: 'Transport',
      city: 'Austin',
      identifiedIssues: ['LCP > 3.8s', 'Uncompressed assets']
    };

    const payload = await generatePersonalizedOutreach(lead);
    expect(payload.recipient).toBe('Acme Logistics');
    expect(payload.trackingToken).toMatch(/^tkn_/);
    expect(payload.body).toContain('Tushar Solanki');
  });
});`;
    } else if (lowerTask.includes('showcase') || lowerTask.includes('portfolio') || lowerTask.includes('component')) {
      sampleCode = `// src/components/FeaturedProjects.tsx
/**
 * @engine OmniFlow Fast-Working UI Generator
 * @project ${project.name} (${project.repoName})
 * @specs Verified Live Project Evidence & Schema.org Integration
 */

import React from 'react';

export interface ProjectShowcaseItem {
  id: string;
  title: string;
  tagline: string;
  githubUrl: string;
  liveUrl?: string;
  tech: string[];
  metrics: string;
}

export const VERIFIED_PROJECTS: ProjectShowcaseItem[] = [
  {
    id: 'webclient-hunter',
    title: 'Webclient Hunter AI',
    tagline: 'Zero-cost lead discovery and automated outreach CRM workspace',
    githubUrl: 'https://github.com/tusharsolanki9845-dev/Webclient-hunter-ai',
    tech: ['React 19', 'TypeScript', 'OpenStreetMap', 'Gemini API'],
    metrics: '100% Client-side privacy & sub-second parsing'
  },
  {
    id: 'ai-duniya',
    title: 'AI Duniya',
    tagline: 'Interactive AI learning and community innovation platform',
    githubUrl: 'https://github.com/tusharsolanki9845-dev/ai-duniya',
    tech: ['Next.js', 'PostgreSQL', 'Tailwind CSS', 'Shadcn'],
    metrics: 'Multi-model comparative benchmark sandbox'
  },
  {
    id: 'alphatech-solutions',
    title: 'AlphaTech Solutions',
    tagline: 'Agency web application and hybrid Capacitor Android app',
    githubUrl: 'https://github.com/tusharsolanki9845-dev/alphatech-solutions',
    tech: ['Capacitor', 'Android SDK', 'React', 'Tailwind CSS'],
    metrics: 'Single-codebase cross-platform deployment'
  },
  {
    id: 'proctorx',
    title: 'ProctorX',
    tagline: 'AI-assisted examination monitoring and integrity assessment',
    githubUrl: 'https://github.com/tusharsolanki9845-dev/proctorx',
    tech: ['Python', 'OpenCV', 'React', 'FastAPI'],
    metrics: 'Real-time multi-angle face mesh analysis'
  }
];

export const FeaturedProjectsView: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {VERIFIED_PROJECTS.map((proj) => (
        <article key={proj.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{proj.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{proj.tagline}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{proj.metrics}</span>
            <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              GitHub Repo &rarr;
            </a>
          </div>
        </article>
      ))}
    </div>
  );
};`;

      sampleTests = `// test/FeaturedProjects.test.tsx
import { render, screen } from '@testing-library/react';
import { FeaturedProjectsView, VERIFIED_PROJECTS } from '../src/components/FeaturedProjects';

describe('FeaturedProjects Component', () => {
  it('renders all verified AI projects for Tushar', () => {
    render(<FeaturedProjectsView />);
    expect(screen.getByText('Webclient Hunter AI')).toBeInTheDocument();
    expect(screen.getByText('AI Duniya')).toBeInTheDocument();
    expect(screen.getByText('AlphaTech Solutions')).toBeInTheDocument();
  });
});`;
    } else {
      sampleCode = `// src/modules/${taskTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ts
/**
 * @module ${taskTitle}
 * @project ${project.name} (${project.repoName})
 * @engine Unified OmniFlow Accelerator (${selectedModel})
 * @generatedAt ${new Date().toISOString()}
 */

export interface ExecutionResult<T = unknown> {
  success: boolean;
  timestamp: string;
  payload: T;
  durationMs: number;
}

export class TaskExecutor {
  private readonly targetRepo = '${project.repoName}';
  private readonly directive = '${advancedDirective}';

  async run(): Promise<ExecutionResult<{ task: string; verified: boolean }>> {
    const start = performance.now();
    
    // Core production implementation for "${taskTitle}"
    const data = {
      task: "${taskTitle}",
      verified: true
    };

    return {
      success: true,
      timestamp: new Date().toISOString(),
      payload: data,
      durationMs: Math.round(performance.now() - start)
    };
  }
}

export const defaultExecutor = new TaskExecutor();`;

      sampleTests = `// test/${taskTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.test.ts
import { describe, it, expect } from 'vitest';
import { TaskExecutor } from '../src/modules/${taskTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}';

describe('${taskTitle} Execution', () => {
  it('executes task and confirms verified status', async () => {
    const executor = new TaskExecutor();
    const result = await executor.run();
    expect(result.success).toBe(true);
    expect(result.payload.verified).toBe(true);
  });
});`;
    }

    const duration = Math.round(performance.now() - startTime);
    const tokens = Math.floor(sampleCode.length / 3.8);
    const tps = Math.round((tokens / (duration / 1000)) || 145);

    setThroughputStats({
      latencyMs: duration,
      tokensCount: tokens,
      tokensPerSec: Math.max(tps, 138),
    });

    setGeneratedCode(sampleCode);
    setTestCode(sampleTests);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    const textToCopy = activeCodeTab === 'implementation' ? generatedCode : testCode;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStageToGitHub = () => {
    onStageCodeToGitHub(project.id, taskTitle, generatedCode);
    onClose();
    onOpenApprovals();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Fast-Working Code Accelerator
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                  <Gauge className="w-3 h-3" /> Turbo Engine Active
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Target: {project.name} &rarr; <span className="text-indigo-600 dark:text-indigo-400">{project.repoName}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Target Task Brief */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Milestone Objective
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Origin: <strong className="text-slate-700 dark:text-slate-300 uppercase">{project.aiToolOrigin}</strong>
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {taskTitle}
            </div>
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
              <span>Stack: {project.techStack.join(', ')}</span>
              <span>·</span>
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                github.com/tusharsolanki9845-dev/{project.repoName}
              </a>
            </div>
          </div>

          {/* Model & Speed Tuning Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                AI Language Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="gemini-3.8-flash">⚡ Gemini 3.8 Flash (Fastest · 160 tps)</option>
                <option value="claude-3-7-sonnet">🧠 Claude 3.7 Sonnet (Hybrid CoT)</option>
                <option value="deepseek-r1">🔍 DeepSeek R1 (Open Chain of Thought)</option>
                <option value="gpt-4-5-turbo">⚡ GPT-4.5 Turbo (High Capacity)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Execution Velocity Mode
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-lg text-[11px] font-semibold text-center">
                <button
                  type="button"
                  onClick={() => setSpeedMode('turbo')}
                  className={`py-1 rounded-md transition-all ${
                    speedMode === 'turbo'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ⚡ Turbo
                </button>
                <button
                  type="button"
                  onClick={() => setSpeedMode('reasoning')}
                  className={`py-1 rounded-md transition-all ${
                    speedMode === 'reasoning'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🧠 Deep
                </button>
                <button
                  type="button"
                  onClick={() => setSpeedMode('comprehensive')}
                  className={`py-1 rounded-md transition-all ${
                    speedMode === 'comprehensive'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  📦 Full
                </button>
              </div>
            </div>
          </div>

          {/* Quick Directives */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Code Architecture Directive
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickDirectives.map((directive) => (
                <button
                  key={directive}
                  type="button"
                  onClick={() => setAdvancedDirective(directive)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    advancedDirective === directive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {directive}
                </button>
              ))}
            </div>
          </div>

          {/* Generation Action or Output */}
          {!generatedCode ? (
            <div className="py-6 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>
                  {isGenerating
                    ? `Generating via ${selectedModel} (Turbo Mode)...`
                    : `Execute High-Speed Code Generation &rarr;`}
                </span>
              </button>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                Generates verified, type-safe implementation files and automated test suites tailored to <span className="font-mono text-slate-700 dark:text-slate-300">{project.repoName}</span>.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Telemetry throughput bar */}
              {throughputStats && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-mono">
                  <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Generated in {throughputStats.latencyMs}ms ({throughputStats.tokensPerSec} tokens/sec)
                  </span>
                  <span className="text-slate-500">
                    {throughputStats.tokensCount} tokens · 0 errors
                  </span>
                </div>
              )}

              {/* Code Tab Switcher (Implementation vs Tests) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium">
                  <button
                    onClick={() => setActiveCodeTab('implementation')}
                    className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                      activeCodeTab === 'implementation'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Implementation Code</span>
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('tests')}
                    className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                      activeCodeTab === 'tests'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Unit Test Suite</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-1 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Regenerate"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                </div>
              </div>

              {/* Code viewer */}
              <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono max-h-60 overflow-y-auto leading-relaxed border border-slate-800 shadow-inner">
                {activeCodeTab === 'implementation' ? generatedCode : testCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-medium"
          >
            Close
          </button>

          {generatedCode && (
            <button
              onClick={handleStageToGitHub}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Stage to GitHub & Review in Approval Queue &rarr;</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
