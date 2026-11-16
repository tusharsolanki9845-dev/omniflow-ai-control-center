import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import { createFirebaseAuthMiddleware } from './src/services/firebaseApiAuth.ts';

process.env.GEMINI_API_KEY = '';

const { app } = await import('./server.ts');
let server: Server;
let baseUrl: string;

before(async () => {
  server = await new Promise<Server>((resolve) => {
    const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('health endpoint reports server health', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test('chat rejects an empty prompt', async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: '  ' }),
  });
  assert.equal(response.status, 400);
});

test('chat reports missing provider configuration instead of returning a mock answer', async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Hello' }),
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /GEMINI_API_KEY/);
});

test('transcription reports missing provider configuration instead of returning a mock transcript', async () => {
  const response = await fetch(`${baseUrl}/api/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64: 'AQID', mimeType: 'audio/webm' }),
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /GEMINI_API_KEY/);
});

test('unknown API routes return JSON 404 responses', async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, 'API endpoint not found.');
});

test('production API routes require a Firebase ID token while health remains public', async () => {
  const previousNetlify = process.env.NETLIFY;
  const previousProjectId = process.env.FIREBASE_PROJECT_ID;
  process.env.NETLIFY = 'true';
  process.env.FIREBASE_PROJECT_ID = 'test-project';

  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const apiResponse = await fetch(`${baseUrl}/api/system/metrics`);
    assert.equal(healthResponse.status, 200);
    assert.equal(apiResponse.status, 401);
  } finally {
    if (previousNetlify === undefined) delete process.env.NETLIFY;
    else process.env.NETLIFY = previousNetlify;
    if (previousProjectId === undefined) delete process.env.FIREBASE_PROJECT_ID;
    else process.env.FIREBASE_PROJECT_ID = previousProjectId;
  }
});

test('Firebase auth middleware accepts only verifier-approved tokens', async () => {
  const protectedApp = express();
  protectedApp.get(
    '/private',
    createFirebaseAuthMiddleware(
      () => 'test-project',
      async (token, projectId) => token === 'approved-token' && projectId === 'test-project'
    ),
    (_req, res) => res.status(204).end()
  );
  const protectedServer = await new Promise<Server>((resolve) => {
    const listeningServer = protectedApp.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });
  const address = protectedServer.address() as AddressInfo;
  const protectedUrl = `http://127.0.0.1:${address.port}/private`;

  try {
    const missingToken = await fetch(protectedUrl);
    const invalidToken = await fetch(protectedUrl, {
      headers: { Authorization: 'Bearer rejected-token' },
    });
    const approvedToken = await fetch(protectedUrl, {
      headers: { Authorization: 'Bearer approved-token' },
    });
    assert.equal(missingToken.status, 401);
    assert.equal(invalidToken.status, 401);
    assert.equal(approvedToken.status, 204);
  } finally {
    await new Promise<void>((resolve, reject) => {
      protectedServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
