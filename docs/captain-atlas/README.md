# Captain Atlas BDD Work Packages

This is the active product specification surface for Portolan.

The user is the captain. The captain gives Cursor Composer or another coding
agent a Portolan link plus a target software ecosystem. The agent installs
Portolan, builds a UA-like local atlas, opens the app, and explains the
landscape, risks, relationships, and drill-down paths.

These files are designed for parallel agents. Each work package is independently
assignable, but all share the product contract in `00-product-contract.md`.

## Work Packages

| Package | Agent Role | First Implementation Artifact |
| --- | --- | --- |
| `00-product-contract.md` | Orchestrator | Shared scorecard and claim boundary for "captain gets atlas". |
| `01-cursor-composer-first-run.md` | Harness agent | Reusable Cursor first-run prompt, transcript, and scorecard. |
| `02-atlas-app-shell.md` | Product UI agent | Bundle-backed atlas app screen that orients a cold reader. |
| `03-landscape-intelligence-producers.md` | Data agent | Fact-family matrix mapped to concrete local producers and bundle fields. |
| `04-agent-qna-drilldown.md` | Agent UX agent | Bounded query contract for answers and selected-code lookup. |
| `05-packaging-qol-security.md` | Platform agent | Doctor/dry-run/receipt/status contract for the target-local run. |
| `06-oss-kill-gates.md` | Competitive agent | Kill / pack / build scorecard for every major capability. |

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
away from the captain-atlas scenario.

## Global Acceptance Bar

Portolan is not demo-ready until this path works:

```text
Captain opens Cursor Composer
Captain says: here is Portolan, here is my multi-repo ecosystem, build my atlas
Cursor installs or prepares Portolan
Cursor runs Portolan without target-specific handholding or prebuilt answers
Portolan generates a local atlas app and data bundle
Captain opens the app and understands repos, components, relationships, risks,
gaps, and drill-down routes
Agent can answer follow-up questions from the atlas bundle
The same path repeats on a second OSS ecosystem
```

Any work that does not improve this path is secondary.
