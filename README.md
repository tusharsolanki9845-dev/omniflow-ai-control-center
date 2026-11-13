<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7a5956c0-0a9b-41b7-a009-e6c5762d6f92

## Run Locally

**Prerequisites:** Node.js 20.19+ or 22.12+ (required by Vite 8)

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in a local `.env` file or the runtime secret store for your deployment target.
3. Run the app locally:
   `npm run dev`
4. Production-style check:
   `NODE_ENV=production PORT=3000 npm run start`

## Global release notes

- The app is configured for `0.0.0.0` binding and cross-origin access so it can be exposed publicly.
- AI endpoints fail fast with a clear 503 in production if `GEMINI_API_KEY` is missing instead of silently using simulated responses.
- Health and system endpoints are available at `/api/health` and `/api/system/metrics` for uptime checks and deployment verification.
