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
npm run serve -- --bundle ../internal/testfixtures/portolan-bundle/portolan-smoke
```

Bundle from `build-portolan-bundle.sh` also includes `landscape-card.json` and `landscape-report.json` for the Overview tab.

Read-only, local-only, stops when the server process exits.
