# Linux CommandCrafter — Deploy Guide

## Bugs Fixed

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `Dockerfile` | Empty — container would never build | Full multi-stage build: Node.js builder → nginx |
| 2 | `index.html` | `importmap` pointing to `aistudiocdn.com` CDN conflicts with Vite bundler | Removed the importmap; Vite resolves all imports from `node_modules` |
| 3 | `package.json` | `@google/genai` imported in code but missing from dependencies | Added `"@google/genai": "^1.35.0"` |
| 4 | `CommandAnalyzer.tsx` | `process.env.API_KEY` — Vite does not support `process.env` in browser code | Changed to `import.meta.env.VITE_GEMINI_API_KEY` |
| 5 | `CommandAnalyzer.tsx` | Model name `'gemini-3-flash-preview'` does not exist | Changed to `'gemini-2.0-flash'` |
| 6 | `docker-compose.yml` | `API_KEY` passed as runtime env var to nginx, but Vite bakes env vars at **build** time | Changed to build arg `VITE_GEMINI_API_KEY` |
| 7 | `SshBuilder.tsx` | `onCommandGenerated` destructured but never used — TypeScript strict error (`noUnusedLocals`) | Removed from destructuring |

---

## Container Deploy (Docker Compose)

```bash
# 1. Copy the example env file
cp .env.example .env   # or just export inline:

# 2. Set your Gemini API key (optional — Analyze tab only)
export VITE_GEMINI_API_KEY=your_gemini_api_key_here

# 3. Build and start
docker compose up -d --build

# App runs at http://localhost:7256
```

> **Why build arg?** Vite embeds `import.meta.env.VITE_*` values at build time into
> the static JS bundle. They are not available at runtime inside nginx. The key must
> be provided when running `docker compose up --build`.

---

## Local Development

```bash
npm install
VITE_GEMINI_API_KEY=your_key npm run dev
```

## Production Build (bare metal)

```bash
npm install
VITE_GEMINI_API_KEY=your_key npm run build
# Serve the `dist/` folder with any static server
```
