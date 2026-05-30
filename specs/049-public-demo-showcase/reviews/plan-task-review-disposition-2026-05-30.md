# Plan And Task Review Disposition - 2026-05-30

## Scope

Pre-implementation review of `spec.md`, `plan.md`, `tasks.md`,
`research.md`, `data-model.md`, and
`contracts/public-demo-showcase.md` for spec 049.

## Review Lanes

| Lane | State | Notes |
| --- | --- | --- |
| `kimi-coding/kimi-for-coding` | assessed | Conditional pass. Required Phase 2 source/privacy artifacts, exact CLI syntax verification, Bigtop license note, T016/T027 smoke split, and `examples/public-demo/bigtop/` path policy. |
| `zai/glm-5.1` | assessed | Conditional pass. Required preflight Bigtop verification, descriptive-vs-artifact data model clarity, bounded query command specificity, stale status fix, and `docs/product-claims.md` confirmation. |
| `minimax/MiniMax-M2.7` | not_assessed | Direct lane returned `404 page not found`. |
| `openrouter/minimax/minimax-m2.7` | not_assessed | Fallback first required reasoning; retry with `--thinking low` produced no usable output before termination. |
| `openrouter/deepseek/deepseek-v4-pro` | assessed replacement | Conditional pass. Required status/branch metadata correction, Bigtop license task, `docs/demo.md` create-or-update clarity, local-output privacy warning, final claim-scan dependency, bounded query excerpt policy, and README path disambiguation. |

## Accepted Findings And Fixes

| Finding | Disposition |
| --- | --- |
| Stale branch metadata in spec and plan | Fixed. Updated both files to `codex/049-public-demo-showcase`. |
| Spec status still said implementation planning | Fixed. Status now says ready for implementation with remaining verification duties. |
| Bigtop license and acquisition policy not explicit enough | Fixed in task contract. T006 now records acquisition options, Apache 2.0 license note, rejected self-map rationale, and network/disk behavior. Data model now requires the Bigtop license note. |
| Exact CLI syntax must be verified before demo text | Fixed in task contract. T007 now records current `context prepare`, `map`, and bounded `query` or `graph slice` evidence. Local CLI help was checked before implementation. |
| `docs/demo.md` create/edit ambiguity | Fixed in task contract. T008 now creates or updates `docs/demo.md`. |
| Full local generated outputs may contain absolute paths | Fixed in plan and task contract. The demo must warn users not to share full local outputs without privacy review. |
| T016 and final smoke duplicated intent | Fixed in task contract. T016 is first-attempt smoke with elapsed time or blocker; T028 is final smoke or blocker. |
| Final claim scan can be false-clean if run before case-study and excerpts | Fixed in task contract. T032 now explicitly runs after T019 and T026. |
| `examples/public-demo/README.md` versus `examples/public-demo/bigtop/README.md` ambiguity | Fixed in plan and tasks. The top-level README is redaction policy; nested README is artifact index/freshness. |
| Bounded query/slice artifact missing from excerpt policy | Fixed in task contract. T025 now records a redacted query/gaps excerpt or an explicit reason for documentation-only handling. |

## Rejected Or Narrowed Findings

| Finding | Disposition |
| --- | --- |
| `quickstart.md` prerequisite missing | Rejected as reviewer packet limitation. `quickstart.md` exists in the spec directory; no repo change required. |
| Need a new machine-clean Bigtop clone before writing any docs | Narrowed. The first public runbook can document public acquisition options first, but T016/T028 must record fresh smoke success or blocker before publication status is claimed. |
| Need schema for the demo data model | Rejected for this docs/artifact slice. The data model is descriptive; validation is through review artifacts, JSON syntax checks for committed excerpts, privacy scan, and claim scan. |

## Implementation Gate

Status: pass after fixes above.

Implementation may proceed with the following constraints:

- Do not commit full Bigtop outputs.
- Do not claim the demo is freshly verified unless the smoke actually runs.
- Keep `not_assessed`, `unknown`, `cannot_verify`, `blocked`, and `failed`
  visible in public wording.
- Treat MiniMax review coverage as degraded and replaced, not assessed.
