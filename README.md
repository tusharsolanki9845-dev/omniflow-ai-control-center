# OmniFlow

OmniFlow is a web control center for AI-assisted workflows, approvals, project tracking, and operational dashboards. The interface stores its workspace state in the browser. The Express service provides Gemini chat/transcription and runtime health endpoints.

The connector registry and workflow console are configuration and preview surfaces. External connector authorization, automated schedules, and tool execution are not implemented; these areas do not perform live actions.

## Requirements

- Node.js 22.12 or later
- npm
- A Gemini API key for chat and transcription
- A Firebase project with GitHub and Google Authentication providers enabled

## Local development

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`, and the `VITE_FIREBASE_*` web configuration.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Enable GitHub and Google sign-in in Firebase Console and authorize `localhost`. Without Firebase configuration, the sign-in screen stays locked and explains the missing setup. Without a Gemini key, AI requests return `503 Service Unavailable`; the app does not return simulated answers.

## Production build

```sh
npm ci
npm run lint
npm test
npm run build
npm start
```

The production server serves the Vite build and listens on `PORT` (default `3000`). Configure `GEMINI_API_KEY` and `FIREBASE_PROJECT_ID` in the hosting provider's function/runtime environment settings. Set the `VITE_FIREBASE_*` variables in the frontend build environment.

## Container deployment

Build and run the included container:

```sh
docker build \
  --build-arg VITE_FIREBASE_API_KEY=your-web-api-key \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com \
  --build-arg VITE_FIREBASE_PROJECT_ID=your-project-id \
  --build-arg VITE_FIREBASE_APP_ID=your-app-id \
  -t omniflow .
docker run --rm -p 3000:3000 -e GEMINI_API_KEY=your-key -e FIREBASE_PROJECT_ID=your-project-id omniflow
```

The service health endpoint is `GET /api/health`.

## Deploy on Netlify

Import this GitHub repository into a Netlify site. `netlify.toml` builds the Vite frontend to `dist` and deploys the Express API as a Netlify Function at `/api/*`. Add `GEMINI_API_KEY` and `FIREBASE_PROJECT_ID` with the Functions scope enabled; do not commit secrets. Set the `VITE_FIREBASE_*` variables with the Build scope enabled. After Firebase is configured, disable Netlify Edge Access so users reach OmniFlow's sign-in page instead of a Netlify login.

OmniFlow requires users to sign in with GitHub or Google before opening the dashboard. In Firebase Console, enable both Authentication providers, add the Netlify site domain to Authorized domains, and configure the GitHub OAuth callback URL shown by Firebase. Store the GitHub OAuth client secret in Firebase Console, never in Netlify frontend variables or source control. Any account from either enabled provider may sign in.

Netlify Functions have a 6 MB request/response payload limit, so audio transcription requests may be rejected before reaching the app if they exceed that platform limit.

## Deploy on Vercel

Import this GitHub repository into a Vercel project. The Vite build publishes the frontend from `dist`, while `api/[...path].ts` exposes the Express API as a Vercel Function. Configure `GEMINI_API_KEY` and `FIREBASE_PROJECT_ID` for functions, and `VITE_FIREBASE_*` for the frontend build. Enable GitHub and Google sign-in providers in Firebase Console and authorize the Vercel domain.

Vercel's free Hobby plan has usage and eligibility limits and is not intended for commercial production use. Review the current plan limits before using the public deployment for a business or service requiring production-level availability. OmniFlow keeps workspace data in each visitor's browser.

## Configuration

See `.env.example` for server configuration. Firebase web configuration is supplied through `VITE_FIREBASE_*` build variables; `FIREBASE_PROJECT_ID` is used by the API to verify Firebase ID tokens. Google Drive uploads additionally require the Google Drive API and `drive.file` scope to be enabled in the Firebase/Google project.
