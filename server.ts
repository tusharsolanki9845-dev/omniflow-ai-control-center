import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type ErrorRequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createFirebaseAuthMiddleware } from './src/services/firebaseApiAuth';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const MAX_PROMPT_LENGTH = 12_000;
const MAX_SYSTEM_PROMPT_LENGTH = 2_000;
const MAX_HISTORY_MESSAGES = 40;
const MAX_TOTAL_INPUT_CHARS = 30_000;
const ALLOWED_GEMINI_MODELS = new Set(
  (process.env.GEMINI_ALLOWED_MODELS || GEMINI_MODEL).split(',').map((value) => value.trim()).filter(Boolean)
);
const REPOSITORY_URL =
  process.env.PUBLIC_REPOSITORY_URL ||
  'https://github.com/tusharsolanki9845-dev/omniflow-ai-control-center';

app.disable('x-powered-by');
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  next();
});
app.use(express.json({ limit: '20mb' }));
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Request limit reached. Try again later.' },
  })
);

const requireFirebaseAuth = createFirebaseAuthMiddleware(() => process.env.FIREBASE_PROJECT_ID);
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || (process.env.NODE_ENV !== 'production' && process.env.NETLIFY !== 'true')) {
    return next();
  }
  return requireFirebaseAuth(req, res, next);
});

const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Try again later.' },
});

const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

let lastCpuSample: { idle: number; total: number } | null = null;

app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/chat', aiRateLimit, async (req, res) => {
  const { prompt, systemPrompt, messages: historyMessages, model } = req.body ?? {};

  // Support both legacy single-prompt and multi-turn history formats
  const hasHistory = Array.isArray(historyMessages) && historyMessages.length > 0;

  if (!hasHistory && (typeof prompt !== 'string' || !prompt.trim())) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  if (typeof prompt === 'string' && prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(413).json({ error: `Prompt must not exceed ${MAX_PROMPT_LENGTH} characters.` });
  }

  if (systemPrompt !== undefined && (typeof systemPrompt !== 'string' || systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH)) {
    return res.status(400).json({ error: `System prompt must be a string of at most ${MAX_SYSTEM_PROMPT_LENGTH} characters.` });
  }

  if (hasHistory) {
    if (historyMessages.length > MAX_HISTORY_MESSAGES) {
      return res.status(413).json({ error: `Conversation history must not exceed ${MAX_HISTORY_MESSAGES} messages.` });
    }
    for (const msg of historyMessages) {
      if (!msg || typeof msg !== 'object' || (msg.role !== 'user' && msg.role !== 'assistant' && msg.role !== 'model')) {
        return res.status(400).json({ error: 'Each history message must have a role of "user" or "assistant".' });
      }
      if (typeof msg.content !== 'string') {
        return res.status(400).json({ error: 'Each history message must include a string content field.' });
      }
    }
  }

  const totalInputChars =
    (typeof prompt === 'string' ? prompt.length : 0) +
    (typeof systemPrompt === 'string' ? systemPrompt.length : 0) +
    (hasHistory ? historyMessages.reduce((total: number, msg: { content: string }) => total + msg.content.length, 0) : 0);
  if (totalInputChars > MAX_TOTAL_INPUT_CHARS) {
    return res.status(413).json({ error: `Combined prompt and conversation must not exceed ${MAX_TOTAL_INPUT_CHARS} characters.` });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'AI chat is unavailable because GEMINI_API_KEY is not configured.',
      code: 'MISSING_API_KEY',
    });
  }

  const selectedModel =
    typeof model === 'string' && model.trim() ? model.trim() : GEMINI_MODEL;
  if (!ALLOWED_GEMINI_MODELS.has(selectedModel)) {
    return res.status(400).json({ error: 'The requested Gemini model is not enabled for this deployment.' });
  }

  try {
    // Build contents for Gemini
    let contents: any;

    if (hasHistory) {
      // Convert history to Gemini format. Gemini uses "user" and "model" roles.
      contents = historyMessages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      // Append the latest user prompt if it was also provided separately
      if (typeof prompt === 'string' && prompt.trim()) {
        contents.push({
          role: 'user',
          parts: [{ text: prompt.trim() }],
        });
      }
    } else {
      contents = prompt;
    }

    const response = await aiClient.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: systemPrompt || 'You are OmniFlow Control Assistant.',
      },
    });

    const usage = response.usageMetadata;
    return res.json({
      text: response.text ?? '',
      model: selectedModel,
      usage: {
        promptTokens: usage?.promptTokenCount ?? 0,
        completionTokens: usage?.candidatesTokenCount ?? 0,
      },
    });
  } catch (error) {
    console.error('Chat generation failed:', error instanceof Error ? error.name : 'UnknownError');
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Provide more actionable error messages
    if (message.includes('API_KEY') || message.includes('api key') || message.includes('401')) {
      return res.status(503).json({
        error: 'Invalid or missing Gemini API key. Check GEMINI_API_KEY in your environment.',
        code: 'INVALID_API_KEY',
      });
    }
    if (message.includes('quota') || message.includes('429') || message.includes('rate')) {
      return res.status(429).json({
        error: 'Gemini rate limit or quota exceeded. Please try again in a moment.',
        code: 'RATE_LIMIT',
      });
    }

    return res.status(502).json({
      error: 'The AI provider could not complete this request.',
      code: 'PROVIDER_ERROR',
    });
  }
});

app.post('/api/chat/stream', aiRateLimit, async (req, res) => {
  const { prompt, systemPrompt, messages: historyMessages, model } = req.body ?? {};
  const hasHistory = Array.isArray(historyMessages) && historyMessages.length > 0;

  if (!hasHistory && (typeof prompt !== 'string' || !prompt.trim())) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  if (typeof prompt === 'string' && prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(413).json({ error: `Prompt must not exceed ${MAX_PROMPT_LENGTH} characters.` });
  }

  if (systemPrompt !== undefined && (typeof systemPrompt !== 'string' || systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH)) {
    return res.status(400).json({ error: `System prompt must be a string of at most ${MAX_SYSTEM_PROMPT_LENGTH} characters.` });
  }

  if (hasHistory) {
    if (historyMessages.length > MAX_HISTORY_MESSAGES) {
      return res.status(413).json({ error: `Conversation history must not exceed ${MAX_HISTORY_MESSAGES} messages.` });
    }
    for (const msg of historyMessages) {
      if (!msg || typeof msg !== 'object' || (msg.role !== 'user' && msg.role !== 'assistant' && msg.role !== 'model')) {
        return res.status(400).json({ error: 'Each history message must have a role of "user" or "assistant".' });
      }
      if (typeof msg.content !== 'string') {
        return res.status(400).json({ error: 'Each history message must include a string content field.' });
      }
    }
  }

  const totalInputChars =
    (typeof prompt === 'string' ? prompt.length : 0) +
    (typeof systemPrompt === 'string' ? systemPrompt.length : 0) +
    (hasHistory ? historyMessages.reduce((total: number, msg: { content: string }) => total + msg.content.length, 0) : 0);
  if (totalInputChars > MAX_TOTAL_INPUT_CHARS) {
    return res.status(413).json({ error: `Combined prompt and conversation must not exceed ${MAX_TOTAL_INPUT_CHARS} characters.` });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'AI chat is unavailable because GEMINI_API_KEY is not configured.',
      code: 'MISSING_API_KEY',
    });
  }

  const selectedModel =
    typeof model === 'string' && model.trim() ? model.trim() : GEMINI_MODEL;
  if (!ALLOWED_GEMINI_MODELS.has(selectedModel)) {
    return res.status(400).json({ error: 'The requested Gemini model is not enabled for this deployment.' });
  }

  let contents: any;
  if (hasHistory) {
    contents = historyMessages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    if (typeof prompt === 'string' && prompt.trim()) {
      contents.push({ role: 'user', parts: [{ text: prompt.trim() }] });
    }
  } else {
    contents = prompt;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  try {
    const stream = await aiClient.models.generateContentStream({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: systemPrompt || 'You are OmniFlow Control Assistant.',
      },
    });

    let fullText = '';
    for await (const chunk of stream) {
      const text = typeof chunk.text === 'string' ? chunk.text : '';
      if (text) {
        fullText += text;
        res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
      }
    }

    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        text: fullText,
        model: selectedModel,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
        },
      })}\n\n`
    );
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Streaming chat failed:', error instanceof Error ? error.name : 'UnknownError');
    const message = error instanceof Error ? error.message : 'Unknown error';
    let code = 'PROVIDER_ERROR';
    let errorText = 'The AI provider could not complete this request.';

    if (message.includes('API_KEY') || message.includes('api key') || message.includes('401')) {
      code = 'INVALID_API_KEY';
      errorText = 'Invalid or missing Gemini API key. Check GEMINI_API_KEY in your environment.';
    } else if (message.includes('quota') || message.includes('429') || message.includes('rate')) {
      code = 'RATE_LIMIT';
      errorText = 'Gemini rate limit or quota exceeded. Please try again in a moment.';
    }

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: errorText, code })}\n\n`);
      res.end();
    } else {
      const status = code === 'INVALID_API_KEY' ? 503 : code === 'RATE_LIMIT' ? 429 : 502;
      res.status(status).json({ error: errorText, code });
    }
  }
});

app.post('/api/transcribe', aiRateLimit, async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm' } = req.body ?? {};

  if (typeof audioBase64 !== 'string' || !audioBase64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(audioBase64)) {
    return res.status(400).json({ error: 'A valid base64 audio payload is required.' });
  }

  const audio = Buffer.from(audioBase64, 'base64');
  if (!audio.length || audio.length > MAX_AUDIO_BYTES) {
    return res.status(413).json({ error: 'Audio must be smaller than 15 MB.' });
  }
  if (typeof mimeType !== 'string') {
    return res.status(400).json({ error: 'A valid audio MIME type is required.' });
  }

  const normalizedMimeType = mimeType.split(';', 1)[0].trim().toLowerCase();
  const supportedMimeTypes = new Set([
    'audio/aac',
    'audio/flac',
    'audio/m4a',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
  ]);
  if (!supportedMimeTypes.has(normalizedMimeType)) {
    return res.status(415).json({ error: 'Unsupported audio MIME type.' });
  }
  if (!aiClient) {
    return res.status(503).json({ error: 'AI transcription is unavailable because GEMINI_API_KEY is not configured.' });
  }

  try {
    const response = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: normalizedMimeType, data: audioBase64 } },
          { text: 'Transcribe the spoken audio accurately. Return only the transcript.' },
        ],
      },
    });

    return res.json({ text: response.text?.trim() ?? '', model: GEMINI_MODEL });
  } catch (error) {
    console.error('Audio transcription failed:', error instanceof Error ? error.name : 'UnknownError');
    return res.status(502).json({ error: 'The AI provider could not transcribe this audio.' });
  }
});

app.get('/api/system/metrics', (_req, res) => {
  const cpus = os.cpus();
  const currentCpuSample = cpus.reduce(
    (sample, cpu) => {
      for (const [type, time] of Object.entries(cpu.times)) {
        sample.total += time;
        if (type === 'idle') sample.idle += time;
      }
      return sample;
    },
    { idle: 0, total: 0 }
  );
  const previousCpuSample = lastCpuSample;
  lastCpuSample = currentCpuSample;

  const totalDelta = previousCpuSample ? currentCpuSample.total - previousCpuSample.total : 0;
  const idleDelta = previousCpuSample ? currentCpuSample.idle - previousCpuSample.idle : 0;
  const cpuPct =
    totalDelta > 0 ? Math.round((1 - idleDelta / totalDelta) * 100) : 0;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const processMemory = process.memoryUsage();
  const loadAvg = os.loadavg();

  return res.json({
    cpuPct: Math.max(0, Math.min(100, cpuPct)),
    memory: {
      usedMb: Math.round(usedMem / (1024 * 1024)),
      totalMb: Math.round(totalMem / (1024 * 1024)),
      freeMb: Math.round(freeMem / (1024 * 1024)),
      percent: totalMem ? Math.round((usedMem / totalMem) * 100) : 0,
    },
    process: {
      rssMb: Math.round(processMemory.rss / (1024 * 1024)),
      heapUsedMb: Math.round(processMemory.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(processMemory.heapTotal / (1024 * 1024)),
    },
    system: {
      cores: cpus.length,
      platform: os.platform(),
      uptimeSeconds: Math.round(process.uptime()),
      loadAvg: loadAvg.map((value) => Number(value.toFixed(2))),
    },
    agent: {
      status: 'not_configured',
      tunnel: 'Not configured',
      port: 0,
      latencyMs: 0,
      allowedDirsCount: 0,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/github/status', (_req, res) => {
  const commitHash = process.env.GIT_COMMIT_SHA || process.env.RENDER_GIT_COMMIT || '';
  return res.json({
    initialized: Boolean(commitHash),
    commitHash: commitHash.slice(0, 12),
    branch: process.env.GIT_BRANCH || '',
    lastCommitMessage: '',
    commitCount: 0,
    repoArchiveUrl: `${REPOSITORY_URL}/archive/refs/heads/main.zip`,
  });
});

app.get('/api/apk/info', (_req, res) =>
  res.status(404).json({ available: false, error: 'No signed Android APK is published.' })
);

app.get(['/api/download/apk', '/omniflow-v1.2-release.apk'], (_req, res) =>
  res.status(404).json({ error: 'No signed Android APK is published.' })
);

app.get(
  ['/api/download/zip', '/api/download/project', '/omniflow-project.zip', '/omniflow-source-v1.2.zip'],
  (_req, res) => res.redirect(302, `${REPOSITORY_URL}/archive/refs/heads/main.zip`)
);

const bundleRootFiles = new Set([
  '.dockerignore',
  'Dockerfile',
  'index.html',
  'package.json',
  'package-lock.json',
  'README.md',
  'tsconfig.json',
  'vite.config.ts',
]);
const textFileExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.svg', '.toml', '.ts', '.tsx', '.txt']);

function getProjectFiles(rootDir: string): Array<{ path: string; size: number; content: string }> {
  const files: Array<{ path: string; size: number; content: string }> = [];
  const ignoredNames = new Set(['.git', 'build', 'coverage', 'dist', 'node_modules']);

  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (
        entry.isSymbolicLink() ||
        (entry.name.startsWith('.') && entry.name !== '.dockerignore') ||
        ignoredNames.has(entry.name)
      ) continue;
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (dir === rootDir && !bundleRootFiles.has(entry.name) && entry.name !== 'public' && entry.name !== 'src') {
        continue;
      }
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && textFileExtensions.has(path.extname(entry.name).toLowerCase())) {
        const stats = fs.statSync(fullPath);
        if (stats.size > 512 * 1024) continue;
        files.push({
          path: relativePath,
          size: stats.size,
          content: fs.readFileSync(fullPath, 'utf8'),
        });
      }
    }
  };

  visit(rootDir);
  return files;
}

app.get('/api/project/bundle', (req, res) => {
  try {
    const files = getProjectFiles(process.cwd());
    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    return res.json({
      name: 'OmniFlow',
      version: process.env.npm_package_version || '0.0.0',
      exportedAt: new Date().toISOString(),
      fileCount: files.length,
      totalBytes,
      totalKb: Math.round(totalBytes / 1024),
      files,
    });
  } catch (error) {
    console.error('Project bundle export failed:', error instanceof Error ? error.name : 'UnknownError');
    return res.status(500).json({ error: 'Failed to export the project bundle.' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath, { index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  console.error('Unhandled request error:', error instanceof Error ? error.name : 'UnknownError');
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
};
app.use(errorHandler);

export { app };

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }

  app.listen(PORT, HOST, () => {
    console.log(`OmniFlow server listening on ${HOST}:${PORT}`);
  });
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entryPath && entryPath === fileURLToPath(import.meta.url)) {
  startServer().catch((error: unknown) => {
    console.error('Server startup failed:', error instanceof Error ? error.message : 'UnknownError');
    process.exitCode = 1;
  });
}
