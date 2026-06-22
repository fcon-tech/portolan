# Implementation Disposition: Spec 109

Date: 2026-06-22
Branch: `codex/109-evidence-promotion-stratified-atlas`

## What Changed

- Added a local evidence-promotion atlas normalizer:
  `viewer/scripts/evidence-promotion-atlas.js`.
- Added build/validate wrappers:
  `scripts/build-evidence-promotion-atlas.sh` and
  `scripts/validate-evidence-promotion-atlas.sh`.
- Added schema coverage for classified sources, promotion health, promoted
  facts, claim records, and lazy raw artifacts:
  `harness/contracts/evidence-promotion-atlas.schema.json`.
- Extended bundle builds to emit `evidence-families.json`,
  `promotion-matrix.json`, `classified-sources.jsonl`,
  `promotion-health.jsonl`, `promoted-facts.jsonl`, `raw-artifacts.jsonl`, and
  `promotion-summary.json`.
- Extended bundle-query, HTTP, and MCP surfaces with `promotion-health`,
  `promoted-facts`, `raw-artifacts`, and `classified-sources`.
- Updated viewer first-screen metrics to show canonical family health,
  degraded states, and promoted fact count before hotspot volume.
- Added `scripts/harness-evidence-promotion-atlas-smoke.sh` with synthetic
  completion coverage, missing-family and `not_integrated` negative validation,
  oversized and stale raw artifact refs, inventory mismatch health, JSON/JSONL
  unresolved catalog relationship health, `source_role` promoted facts, and
  broken-claim-ref rejection.

## Verification

- verified: `go test ./...`
- verified: `go vet ./...`
- verified: `jq empty schema/*.json harness/contracts/*.json`
- verified: `node -c viewer/src/app.js`
- verified: `node -c viewer/scripts/evidence-promotion-atlas.js`
- verified: `node -c viewer/scripts/bundle-query.js`
- verified: `node -c viewer/scripts/bundle-query-cli.js`
- verified: `node -c viewer/scripts/bundle-query-mcp.js`
- verified: `scripts/harness-evidence-promotion-atlas-smoke.sh`
- verified: `scripts/harness-bundle-query-smoke.sh`
- verified: `scripts/harness-bundle-query-mcp-smoke.sh`
- verified: `scripts/harness-portolan-smoke.sh`
- verified: `scripts/portolan-scan.sh --help`
- verified: `git diff --check`
- verified: available Bigtop lab core bundle copied to a temp directory,
  promotion layer built and validated without mutating the lab artifact.

## Not Assessed

- Independent OpenCode review coverage is incomplete. The repo preflight
  `scripts/harness-review-opencode-smoke.sh` produced no output for roughly 90
  seconds and was interrupted with exit 130. Follow-up `opencode-go/glm-5.1`
  and `kimi-for-coding/k2p6` attempts timed out after 240 seconds each, so no
  output from those attempts is counted as assessed implementation review
  evidence. A later `minimax/MiniMax-M2.7` lane completed and is recorded in
  `reviews/opencode-minimax-m2.7-2026-06-22.md`; it counts as one assessed
  lane. A later `opencode-go/deepseek-v4-flash` lane completed and is recorded
  in `reviews/opencode-deepseek-v4-flash-2026-06-22.md`; it counts as a second
  assessed lane. Qwen, Gemini Flash, and Kimi replacement attempts did not
  produce assessed review output, so repo delivery rules still require one
  additional assessed independent review lane before marking the PR
  ready-for-review.
- Two partial timeout observations were accepted and fixed before final local
  verification: the viewer needed an explicit promotion-health drill-down panel,
  and the agent command list needed the new spec 109 query families.
- MiniMax review findings were accepted and fixed before final local
  verification: JSONL catalog unresolved-relations coverage, stale raw artifact
  health, inventory mismatch health, `not_integrated` completion validation,
  `source_role` promoted facts, and top-level `bundle-query` `fact_kind`.
- DeepSeek review finding accepted and fixed before final local verification:
  `promotion-health`, `promoted-facts`, `raw-artifacts`, and
  `classified-sources` family filters now match `row.family` only, without
  falling back to record ids.
- Full 3,019,203-row Bigtop symbol pollution proof is not assessed in this
  branch because the full input bundle referenced by the research artifact was
  not present as a local reusable bundle. The available lab core bundle contains
  3,600 promoted symbol rows and verifies bounded degraded health behavior, but
  it does not cross the 50 percent pollution threshold.
- One additional independent PR review lane and merge readiness are not
  assessed yet.

## Risks

- The source-role classifier is deliberately minimal path rules, not Linguist or
  go-enry. It emits low-confidence/non-exhaustive health when coverage is weak.
- Real semantic-index, runtime, catalog, and deployment producers may need
  richer family-specific importers later. Current routes are non-stub local
  artifact routes for completion validation, not scanner replacements.
