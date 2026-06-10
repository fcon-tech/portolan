# Portolan Orient Viewer

UA-inspired local map for evidence-backed hotspots. Loads `orient/` bundle only;
does not accept LLM-generated graphs as truth.

## Build and serve

```bash
node scripts/build-static.js
node scripts/serve.js --bundle /path/to/orient
```

Or with npm when available: `npm run build && npm run serve -- --bundle /path/to/orient`

Open http://127.0.0.1:4173/

## Fixture smoke

```bash
npm run build
npm run serve -- --bundle ../internal/testfixtures/orient-bundle/orient
```

Read-only, local-only, stops when the server process exits.
