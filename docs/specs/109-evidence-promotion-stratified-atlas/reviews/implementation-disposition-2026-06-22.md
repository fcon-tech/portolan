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
- Review-blocker pass added git-aware source inventory, explicit fallback and
  truncation `non_exhaustive` health, strict JSONL validation, family-total
  oversize health, reachable `secret_reference_surface` classification,
  `package.json` build-metadata classification, `raw_available_only` family
  health, and required atlas build failures in core/full bundle paths.

## Verification

- verified in blocker-fix pass: `node -c
  viewer/scripts/evidence-promotion-atlas.js`
- verified in blocker-fix pass: `node -c
  viewer/scripts/validate-atlas-schemas.js`
- verified in blocker-fix pass: `scripts/harness-evidence-promotion-atlas-smoke.sh`
- verified in blocker-fix pass: `scripts/harness-bundle-query-smoke.sh`
- verified in blocker-fix pass: `scripts/harness-bundle-query-mcp-smoke.sh`
- verified in blocker-fix pass: `jq empty harness/contracts/*.json`
- verified in blocker-fix pass: `scripts/harness-portolan-smoke.sh`
- verified in blocker-fix pass after final documentation update: `git diff
  --check`
- previous pre-blocker-pass baseline included Go tests, vet, scan help, and
  Bigtop lab core-bundle promotion validation; those are stale for this
  blocker-fix head unless rerun.

## Not Assessed

- Independent OpenCode review coverage was degraded before this blocker-fix
  pass. The repo preflight
  `scripts/harness-review-opencode-smoke.sh` produced no output for roughly 90
  seconds and was interrupted with exit 130. Follow-up `opencode-go/glm-5.1`
  and `kimi-for-coding/k2p6` attempts timed out after 240 seconds each, so no
  output from those attempts is counted as assessed implementation review
  evidence. A later `minimax/MiniMax-M2.7` lane completed and is recorded in
  `reviews/opencode-minimax-m2.7-2026-06-22.md`; it counts as one assessed
  lane. A later `opencode-go/deepseek-v4-flash` lane completed and is recorded
  in `reviews/opencode-deepseek-v4-flash-2026-06-22.md`; it counts as a second
  assessed lane. Qwen, Gemini Flash, and Kimi replacement attempts did not
  produce assessed review output. A later
  `openrouter/~anthropic/claude-haiku-latest` lane completed and is recorded in
  `reviews/opencode-claude-haiku-latest-2026-06-22.md`; it counts as the third
  assessed lane.
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
- Claude Haiku review finding accepted and fixed before final local
  verification: symbol-index promoted facts normalize producer-supplied
  `evidence_state` through the allowed enum and fall back to
  `metadata-visible`.
- GitHub review approval remains `not_assessed`.
- Full 3,019,203-row Bigtop symbol pollution proof is not assessed in this
  branch because the full input bundle referenced by the research artifact was
  not present as a local reusable bundle. The available lab core bundle contains
  3,600 promoted symbol rows and verifies bounded degraded health behavior, but
  it does not cross the 50 percent pollution threshold.
- Merge readiness is not ready; no merge approval was requested or verified.

## Risks

- The source-role classifier is deliberately minimal path rules, not Linguist or
  go-enry. It emits low-confidence/non-exhaustive health when coverage is weak.
- Real semantic-index, runtime, catalog, and deployment producers may need
  richer family-specific importers later. Current routes are non-stub local
  artifact routes for completion validation, not scanner replacements.
