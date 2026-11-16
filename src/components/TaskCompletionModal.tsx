import React, { useState } from 'react';
import {
  Sparkles,
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
import { authenticatedFetch } from '../services/firebaseAuthService';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: AIProject | null;
  taskTitle: string;
}

type SpeedMode = 'turbo' | 'reasoning' | 'comprehensive';

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  isOpen,
  onClose,
  project,
  taskTitle,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [speedMode, setSpeedMode] = useState<SpeedMode>('turbo');
  const [advancedDirective, setAdvancedDirective] = useState<string>('⚡ Fast Clean Code');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [testCode, setTestCode] = useState<string>('');
  const [activeCodeTab, setActiveCodeTab] = useState<'implementation' | 'tests'>('implementation');
  const [copied, setCopied] = useState(false);
  const [throughputStats, setThroughputStats] = useState<{
    latencyMs: number;
    tokensCount: number | null;
  } | null>(null);

  if (!isOpen || !project) return null;

  const quickDirectives = [
    'Concise implementation',
    'Strict typing and error handling',
    'Consider asynchronous behavior',
    'Prefer existing dependencies',
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    const startedAt = performance.now();

    try {
      const response = await authenticatedFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'You are a senior software engineer. Produce a practical implementation and focused tests. Do not claim to have inspected files that were not provided. Return only valid JSON with string fields implementation and tests.',
          prompt: JSON.stringify({
            project: { name: project.name, repository: project.repoName, description: project.description, techStack: project.techStack },
            task: taskTitle,
            directive: advancedDirective,
            speedMode,
            customPrompt,
          }),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Code generation request failed.');
      if (typeof result.text !== 'string' || !result.text.trim()) throw new Error('The model returned no code.');

      let output: { implementation?: string; tests?: string };
      try {
        output = JSON.parse(result.text);
      } catch {
        output = { implementation: result.text, tests: '' };
      }
      if (!output.implementation?.trim()) throw new Error('The model response did not contain an implementation.');

      setGeneratedCode(output.implementation);
      setTestCode(output.tests || '');
      const reportedTokens = (result.usage?.promptTokens || 0) + (result.usage?.completionTokens || 0);
      const duration = Math.round(performance.now() - startedAt);
      setThroughputStats({
        latencyMs: duration,
        tokensCount: reportedTokens > 0 ? reportedTokens : null,
      });
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Code generation request failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = activeCodeTab === 'implementation' ? generatedCode : testCode;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                  Code Draft
                </h2>
                <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded flex items-center gap-1 border border-indigo-300 dark:border-indigo-800">
                  Gemini API
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
                {project.repoName}
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
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (server default)</option>
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
          {generationError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}

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
                    : 'Generate code draft'}
                </span>
              </button>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                Generates an AI-assisted draft for <span className="font-mono text-slate-700 dark:text-slate-300">{project.repoName}</span>. Review and test it before use; it does not modify the repository.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Telemetry throughput bar */}
              {throughputStats && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-mono">
                  <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Request completed in {throughputStats.latencyMs}ms
                  </span>
                  <span className="text-slate-500">
                    {throughputStats.tokensCount === null ? 'Provider usage unavailable' : `${throughputStats.tokensCount} tokens reported`}
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

        </div>
      </motion.div>
    </div>
  );
};
