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

## Deploy on Netlify

Import this GitHub repository into a Netlify site. `netlify.toml` builds the Vite frontend to `dist` and deploys the Express API as a Netlify Function at `/api/*`. Add `GEMINI_API_KEY` in the site's environment variables with the Functions scope enabled; do not commit it. Add `VITE_FIREBASE_*` build variables if Google Drive sign-in is needed.

Netlify Functions have a 6 MB request/response payload limit, so audio transcription requests may be rejected before reaching the app if they exceed that platform limit.

## Deploy on Vercel

Import this GitHub repository into a Vercel project. The Vite build publishes the frontend from `dist`, while `api/[...path].ts` exposes the Express API as a Vercel Function. Add `GEMINI_API_KEY` as an environment variable in the Vercel project settings; do not commit it.

Vercel's free Hobby plan has usage and eligibility limits and is not intended for commercial production use. Review the current plan limits before using the public deployment for a business or service requiring production-level availability. OmniFlow keeps workspace data in each visitor's browser.

## Configuration

See `.env.example` for server configuration. Google Drive sign-in additionally requires a Firebase project configured with this app's authorized domains and Google provider enabled. Firebase web configuration is supplied through `VITE_FIREBASE_*` build variables.
