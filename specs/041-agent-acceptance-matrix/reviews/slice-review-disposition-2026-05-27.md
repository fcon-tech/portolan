# Slice Review Disposition: Agent Acceptance Matrix

Date: 2026-05-27
Spec: `specs/041-agent-acceptance-matrix/`
Review scope: documentation, acceptance matrix, blind prompt, lane ledger,
product claim boundary, and spec-local review evidence.

## Review Lanes

| Lane | Model | Result | Evidence |
| --- | --- | --- | --- |
| requirements/evidence review | `kimi-coding/kimi-for-coding` via `pi --no-tools --no-context-files --no-session` | assessed | `model-review-kimi-2026-05-27.md` |
| requirements/evidence review | `zai/glm-5.1` via `pi --no-tools --no-context-files --no-session` | assessed | `model-review-glm-2026-05-27.md` |
| requirements/evidence review | `openrouter/deepseek/deepseek-v4-pro` via `pi --no-tools --no-context-files --no-session` | assessed | `model-review-deepseek-2026-05-27.md` |
| focused re-review | `openrouter/deepseek/deepseek-v4-pro` via `pi --no-tools --no-context-files --no-session` | assessed | `focused-review-deepseek-2026-05-27.md` |

No GPT-family model was counted as independent review evidence.

## Findings And Disposition

### F1: Product claim wording implied broad multi-harness support

- Source: `model-review-deepseek-2026-05-27.md`
- Severity: minor
- Disposition: accepted and fixed
- Fix: changed the claim row from "can support blind acceptance runs" to
  "defines a blind acceptance matrix contract" and kept safe wording scoped to
  the Codex single-repo self-target lane.
- Re-review: `focused-review-deepseek-2026-05-27.md` says no overclaiming
  remains.

### F2: Verified matrix cell needed inline self-scored/self-target caveat

- Source: `model-review-glm-2026-05-27.md`
- Severity: moderate
- Disposition: accepted and fixed
- Fix: updated `acceptance-matrix-2026-05-27.md` so the `codex-single-repo`
  reason states the lane is a Portolan self-target and self-scored, with
  independent review only through slice review lanes.
- Re-review: `focused-review-deepseek-2026-05-27.md` says the matrix snapshot
  clearly marks the verified lane as self-scored/self-target.

### F3: `cannot_verify` scoring path was unexercised

- Sources: `model-review-kimi-2026-05-27.md`,
  `model-review-glm-2026-05-27.md`
- Severity: minor
- Disposition: accepted as an explicit limitation
- Fix: lane ledger now records `cannot_verify` references as `0` and says the
  scoring path is unexercised by this target.
- Remaining state: black-box/metadata-heavy lanes remain `not_assessed`.

### F4: Blind prompt referenced `docs/agent/QUICKSTART.md`

- Source: `model-review-glm-2026-05-27.md`
- Severity: minor
- Disposition: verified locally
- Evidence: `test -f docs/agent/QUICKSTART.md` passed; `rg` found
  `scripts/bootstrap-portolan`, `go run ./cmd/portolan`, and
  `context prepare` source-checkout instructions in that file.

### F5: Prompt hash command and analyze traceability were weak

- Source: `model-review-glm-2026-05-27.md`
- Severity: minor
- Disposition: accepted and fixed
- Fixes:
  - lane ledger now records the hash command:
    `sha256sum docs/agent/ACCEPTANCE.md`
  - analyze disposition links each accepted finding to the implementation
    artifact that resolved it

## Not Assessed

- Cursor UI/Composer lanes
- OpenCode lanes
- Codex multi-repo and black-box/metadata-heavy lanes
- external non-Portolan single-repo targets
- active `cannot_verify` scoring path
- GitHub PR state and GitHub checks

## Outcome

All accepted review findings are fixed or explicitly preserved as
`not_assessed` limitations. No unresolved blocking findings remain for local
implementation completion.
