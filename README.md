# Portolan v3

A frontier agent (the **Cartographer**) builds and maintains a living
tech-design map of a brownfield codebase — the **Chart** — stored inside the
target repo, so a human (the **Governor**) can understand how and why the
codebase works: component behavior, connections, C4 views, API contracts,
and where it smells.

```
survey <target> with Portolan    ← the whole first-run UX
```

- Product contract: [docs/MANIFEST.md](docs/MANIFEST.md) — postulates,
  chart format, trust vocabulary, tools, permissions, non-goals, glossary.
- Acceptance: [acceptance/bigtop-sea-trial.md](acceptance/bigtop-sea-trial.md)
  — the Bigtop sea-trial gate.
- Landing page (screenshots, trust ladder, demo province, quickstart):
  [docs/landing.html](docs/landing.html)
- Status: v1 built and tested, sea-tried on the Bigtop corpus — `core/`
  (chart store + the twelve MCP tools + stdio server), `skill/` (the
  Cartographer's method), `adapters/` (opencode first, pi/omp shims,
  drop-in night-watch crontab), `acceptance/` (Bigtop sea-trial runner).
  Reading layer: every charted province exports a one-file **Chart Room**
  (`bun core/src/chartroom/cli.ts render --target <t>` — nautical map +
  dependency graph, find & filters, hover atlas plates, tangle whirlpools,
  Notices panel, dossier with the observed/verified/declared/claimed
  ledger), and a **Fleet review** sheet assembles several provinces as
  archipelagos (`bun core/src/chartroom/cli.ts review --target <t1>
  --target <t2> …`). The harbor runs headless: `propose`, bounded `watch`,
  manual `run` of any single proposal by fingerprint.

The v2 repository (`../portolan`) is frozen as a reference: mine ideas, not
code. Lessons learned there are recorded in the manifest.
