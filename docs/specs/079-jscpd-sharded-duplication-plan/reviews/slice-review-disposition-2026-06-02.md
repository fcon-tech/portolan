# Slice Review Disposition

Spec: `docs/specs/079-jscpd-sharded-duplication-plan/`

Date: 2026-06-02

## Review Lanes

assessed:

- `zai/glm-5.1`
  - raw output:
    `docs/specs/079-jscpd-sharded-duplication-plan/reviews/pi-glm-079-slice-review-2026-06-02.md`
  - verdict: accept; no critical or major findings.
- `openrouter/xiaomi/mimo-v2.5-pro`
  - raw output:
    `docs/specs/079-jscpd-sharded-duplication-plan/reviews/pi-mimo-079-slice-review-2026-06-02.md`
  - verdict: pass with actionable test-hardening findings.
- `openrouter/moonshotai/kimi-k2.6`
  - raw output:
    `docs/specs/079-jscpd-sharded-duplication-plan/reviews/pi-kimi-k2-079-slice-review-2026-06-02.md`
  - verdict: accept with minor notes.

post-PR stress:

- `cursor-agent --print --mode ask --model composer-2.5`
  - prompt:
    `docs/specs/079-jscpd-sharded-duplication-plan/stress/cursor-jscpd-sharded-plan-prompt-2026-06-02.md`
  - raw output:
    `docs/specs/079-jscpd-sharded-duplication-plan/stress/cursor-jscpd-sharded-plan-output-2026-06-02.md`
  - disposition:
    `docs/specs/079-jscpd-sharded-duplication-plan/reviews/cursor-jscpd-sharded-plan-stress-2026-06-02.md`
  - verdict: verified lane; adequate navigation-harness improvement for the
    duplication/OOM gap, while actual duplication evidence remains
    `not_assessed`.

## Accepted Findings And Fixes

fixed:

- Added exact assertions that multi-repo jscpd writes use
  `tool-outputs/jscpd/<repo-id>/jscpd-report.json`.
- Added assertions that sharded command limits include repository-shard-only
  scope, failed/missing/unrun shard honesty, and cross-repository clone
  `not_assessed`.
- Added a single-repository test that verifies the jscpd plan does not claim
  sharded mode and keeps the unsharded report path.

rejected:

- Kimi K2 reported `jscpdCommand` parameter `out` as unused. This is incorrect;
  the helper uses `out` to generate the `AfterRun` context refresh command.

accepted as non-blocking:

- `safeID` path safety is an existing helper; the new tests cover concrete repo
  IDs and exact output paths for this slice.
- Cross-repository clone detection remains out of scope and `not_assessed`.

## Verification After Fixes

verified:

- `go test ./internal/contextprep`
- `go test ./internal/app`
- `go test ./...`
- `go vet ./...`
- `jq empty schema/*.json`
- `git diff --check`
- Cursor Composer 2.5 sharded-plan stress read only the fresh context artifacts,
  identified 18 repository-sharded jscpd commands, and preserved duplication
  metrics as `not_assessed`.

not_assessed:

- Actual jscpd execution.
- Cross-repository clone detection.
- Spec 076 Cursor parity validation.

## Disposition

accepted:

- Three assessed independent non-GPT lanes accepted the slice after bounded
  review.
- No critical or major blocker remains for ready-for-review state.
