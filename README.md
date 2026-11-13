# OmniFlow

OmniFlow is a web control center for AI-assisted workflows, approvals, project tracking, and operational dashboards. The interface stores its workspace state in the browser. The Express service provides Gemini chat/transcription and runtime health endpoints.

The connector registry and workflow console are configuration and preview surfaces. External connector authorization, automated schedules, and tool execution are not implemented; these areas do not perform live actions.

## Requirements

- Node.js 22.12 or later
- npm
- A Gemini API key for chat and transcription

## Local development

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Without a Gemini key, AI requests return `503 Service Unavailable`; the app does not return simulated answers.

## Production build

```sh
npm ci
npm run lint
npm test
npm run build
npm start
```

The production server serves the Vite build and listens on `PORT` (default `3000`). Configure `GEMINI_API_KEY` and, optionally, `GEMINI_MODEL` in the hosting provider's secret/environment settings.

## Container deployment

Build and run the included container:

```sh
docker build -t omniflow .
docker run --rm -p 3000:3000 -e GEMINI_API_KEY=your-key omniflow
```

The service health endpoint is `GET /api/health`.

## Deploy a free preview on Render

The included `render.yaml` configures a Docker web service with `/api/health` as its health check. In Render, create a new Blueprint from this GitHub repository and choose the Free plan. Set `GEMINI_API_KEY` as a secret in the Render dashboard; do not commit it to the repository.

Render's Free web services spin down after 15 minutes without traffic, can take about a minute to wake, have ephemeral storage, and may be restarted or suspended when included usage limits are reached. Render states that Free instances are not intended for production applications. Use this option for a no-cost demo, not a production service with uptime or data-persistence requirements.

OmniFlow stores workspace data in the visitor's browser. The Express backend is required for chat, transcription, and system health endpoints; static-only hosting will not provide those APIs.

## Configuration

See `.env.example` for server configuration. Google Drive sign-in additionally requires a Firebase project configured with this app's authorized domains and Google provider enabled. Firebase web configuration is supplied through `VITE_FIREBASE_*` build variables.
