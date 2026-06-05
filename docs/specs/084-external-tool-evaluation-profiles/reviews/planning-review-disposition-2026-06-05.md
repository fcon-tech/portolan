# Planning Review Disposition: Spec 084

Date: 2026-06-05

Scope: `spec.md`, `plan.md`, `tasks.md`, SpecKit readiness, product boundary,
constitution alignment, and evidence-state semantics before implementation.

## Review Lanes

| Lane | Raw Output | Status | Verdict |
| --- | --- | --- | --- |
| `kimi-for-coding/k2p6` via `opencode run` | `raw-planning-kimi-k2p6-2026-06-05.md` | assessed | PASS with minor hygiene findings |
| `zai-coding-plan/glm-5.1` via `opencode run` | `raw-planning-zai-glm51-2026-06-05.md` | assessed | PASS with minor findings |
| `opencode-go/minimax-m3` via `opencode run` | `raw-planning-minimax-m3-2026-06-05.md` | assessed | CHANGES_REQUESTED before closeout |

Note: The MiniMax lane observed its own raw-output file while it was still being
written and incorrectly reported that lane as 0 bytes. The final raw file
contains an assessed review, so that self-observation is rejected as stale
harness timing evidence.

## Accepted Findings And Fixes

- Branch metadata drift: fixed by changing `spec.md` to
  `codex/084-external-tool-evaluation-profiles`.
- Spec status/backlog drift: fixed by marking `spec.md` and
  `docs/product-backlog.md` ready for implementation while leaving
  implementation and PR verification `not_assessed`.
- Docs-heavy PR quality lenses: fixed by clarifying T022 so docs-only lenses are
  `not_applicable` with diff evidence, while bounded Go changes still receive
  applicable code-quality review.
- Parallel role vocabulary risk: fixed by documenting that profile `role` is a
  product-facing companion label only and does not replace existing
  producer-family `Decision`/`SupportState` records.
- Spec assumption vs contextprep change: fixed by stating that a bounded
  `internal/contextprep` pointer is allowed and is not an importer, schema
  change, or graph evidence fact.
- Cross-spec coordination: fixed by linking future backlog-only slices 085 and
  086 from the spec.
- Snapshot freshness: fixed by requiring metadata refresh before PR readiness if
  more than one day has passed since `last_refreshed`.

## Rejected Findings

- MiniMax F1 said MiniMax itself did not count because its raw file was empty.
  Rejected: the model read the file before shell redirection flushed the final
  output. The final file is non-empty and contains a substantive review.
- GLM F8 said the GLM raw file was empty. Rejected for the same stale
  self-observation pattern; the final file contains an assessed review.

## Readiness Decision

Plan/tasks readiness: verified.

Implementation may proceed after T001-T005 are marked complete in `tasks.md`.

## Not Assessed

- Implementation behavior for `docs/adapter-contracts/` and
  `internal/contextprep`.
- GitHub checks, PR state, and merge readiness.
- Real CodeGraph, Understand-Anything, or ast-index execution/output.
