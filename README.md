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
- Status: v1 built and tested — `core/` (chart store + the eleven MCP tools +
  stdio server), `skill/` (the Cartographer's method), `adapters/`
  (opencode first, pi/omp shims), `acceptance/` (Bigtop sea-trial runner).
  Next milestone: the first real expedition against the Bigtop corpus and
  its sea trial.

The v2 repository (`../portolan`) is frozen as a reference: mine ideas, not
code. Lessons learned there are recorded in the manifest.
