# Portolan Product Work Packages

This is the active product specification surface for Portolan.

For the next implementation pass, start with
`07-portolan-core-product-spec.md`. It is the one-file goal specification that
corrects the graph-first demo drift and defines the required product behavior:
Cursor first-run, typed entities, C4, dossiers, surfaces, BDD, and testing.

> **Failed-spike note (Task A).** The previous public graph dashboard (the
> node-link map where repositories, docs, CI, support matrix, mailing lists,
> packages, and runtime surfaces were all equal peer nodes) is a **failed
> spike**. It is retained only as negative evidence. The meaning-first
> system-map UI (`viewer/src/app.js`, driven by
> `schema/system-map.schema.json`) is the product direction. Do not continue
> the graph-first topology by adding another panel or tooltip layer.

The user gives Cursor Composer, Cursor Agent CLI, or another shell-capable
coding agent a Portolan link plus a target software ecosystem. The agent
installs Portolan, runs bounded local discovery, produces a structured system
map and local UI, and explains components, relationships, risks, gaps, and
drill-down routes.

For automated acceptance, Cursor means the terminal/headless Cursor Agent lane
(`cursor-agent` or `cursor agent`) using the same instructions a Composer user
receives. GUI Cursor behavior is useful confirmation, not the primary product
gate.

These files are designed for parallel agents, but they are not equal sources of
truth for the next implementation pass. The next goal-agent implementation must
follow `07-portolan-core-product-spec.md` as the controlling scope.

If `00-product-contract.md` through `06-oss-kill-gates.md` contradict `07`, use
`07`. Treat the older package files as supporting notes until they are reconciled.

## Work Packages

| Package | Agent Role | First Implementation Artifact |
| --- | --- | --- |
| `00-product-contract.md` | Orchestrator | Supporting scorecard and claim boundary for the agent first-run result. |
| `01-cursor-composer-first-run.md` | Harness agent | Supporting Cursor first-run prompt, transcript, and scorecard notes. |
| `02-atlas-app-shell.md` | Product UI agent | Supporting UI shell notes; `07` wins on overview-first and graph-drift rules. |
| `03-landscape-intelligence-producers.md` | Data agent | Supporting fact-family matrix mapped to local producers and bundle fields. |
| `04-agent-qna-drilldown.md` | Agent UX agent | Supporting bounded query contract for answers and selected-code lookup. |
| `05-packaging-qol-security.md` | Platform agent | Supporting doctor/dry-run/receipt/status contract for the target-local run. |
| `06-oss-kill-gates.md` | Competitive agent | Supporting kill / pack / build scorecard for every major capability. |
| `07-portolan-core-product-spec.md` | Goal agent | One-file implementation spec for rebuilding the product slice around typed entities, C4, dossiers, Cursor first-run, and BDD. |

## Package Ownership

Each work package must name:

- owned surfaces and out-of-scope surfaces;
- first vertical slice that can be implemented and reviewed independently;
- generated artifact or scorecard that proves the slice;
- exact verification command, harness run, or manual check;
- kill / pack / build recommendation when existing tools may win.

## Parallel Work Protocol

Each agent must return:

- scenario verdict: `verified`, `failed`, `blocked`, or `not_assessed`;
- commands or manual steps actually run;
- files or surfaces changed;
- user-visible demo evidence;
- top product gaps;
- kill / pack / build recommendation for its package.

Do not use historical backlog/spec directories as authority. They were removed
from the active product surface because they encoded stale tracks and drifted
away from the current Portolan first-run scenario.

## Global Acceptance Bar

Portolan is not demo-ready until this path works:

```text
Captain opens Cursor Composer or Cursor Agent CLI
Captain says: here is Portolan, here is my multi-repo ecosystem, build the Portolan result
Cursor installs or prepares Portolan
Cursor runs Portolan without target-specific handholding or prebuilt answers
Portolan generates a local UI and data bundle
Captain opens the UI and understands repos, components, relationships, risks,
gaps, and drill-down routes
Agent can answer follow-up questions from the Portolan bundle
The same path repeats on a second OSS ecosystem
```

Any work that does not improve this path is secondary.
