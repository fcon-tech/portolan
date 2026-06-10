# Portolan Viewer

Local UI for ranked scanner hotspots and a folder tree. Loads a Portolan bundle
(`manifest.json`, `hotspots.jsonl`, …) only — no LLM-generated graphs.

## Build and serve

```bash
node scripts/build-static.js
node scripts/serve.js --bundle /path/to/bundle
```

Or with npm when available: `npm run build && npm run serve -- --bundle /path/to/bundle`

Open http://127.0.0.1:4173/

## Fixture smoke

```bash
npm run build
npm run serve -- --bundle ../internal/testfixtures/orient-bundle/orient-smoke
```

Read-only, local-only, stops when the server process exits.
