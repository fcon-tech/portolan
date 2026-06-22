# PR Readiness Closeout: Spec 109

Date: 2026-06-22
PR: https://github.com/fcon-tech/portolan/pull/73
Branch: `codex/109-evidence-promotion-stratified-atlas`
Base: `portolan-next`
Blocker-fix base head before this pass:
`639105ddf61640cab972aef3a62c2da86ad36cd5`

## State Matrix

- Implementation: blocker-fix pass complete locally.
- Local verification: verified for the blocker-fix head; see local verification
  evidence below.
- Review evidence: degraded but sufficient for the earlier PR review cycle.
  `scripts/harness-review-opencode-smoke.sh` hung
  with no output and was interrupted after roughly 90 seconds.
  `opencode-go/glm-5.1` and `kimi-for-coding/k2p6` attempts timed out after 240
  seconds each. A later `minimax/MiniMax-M2.7` lane completed and is recorded
  in `reviews/opencode-minimax-m2.7-2026-06-22.md`; accepted findings were
  fixed locally. A later `opencode-go/deepseek-v4-flash` lane completed and is
  recorded in `reviews/opencode-deepseek-v4-flash-2026-06-22.md`; accepted
  findings were fixed locally. Qwen, Gemini Flash, Kimi, and MiMo replacement
  lanes did not produce assessed review output. A later
  `openrouter/~anthropic/claude-haiku-latest` lane completed and is recorded in
  `reviews/opencode-claude-haiku-latest-2026-06-22.md`; accepted findings were
  fixed locally. This is three assessed independent lanes for the earlier PR
  review cycle. The current blocker-fix pass is documented in
  `reviews/review-blocker-disposition-2026-06-22.md`.
- Requirements drift: no open task checkboxes remain; spec/backlog/tasks now
  describe blocker-fix PR state and current-head full Bigtop regression
  evidence.
- Product vision drift: no new network access, daemon behavior, credential use,
  target mutation, or scanner replacement was added. Implementation normalizes
  local bundle/producers artifacts only.
- PR state: ready-for-review; not draft.
- GitHub checks: Baseline passing on current head.
- Code-review approval: separate GitHub/human code-review approval was waived
  by the project owner on 2026-06-22. GitHub `reviewDecision` may remain empty.
- Merge readiness: mergeable and CI green after current-head refresh, but not
  merged.
- Stop reason: merge still requires an explicit merge command.

## Local Verification Evidence

- verified: `node -c viewer/scripts/evidence-promotion-atlas.js`
- verified: `node -c viewer/scripts/validate-atlas-schemas.js`
- verified: `node -c viewer/scripts/bundle-query.js`
- verified: `node -c viewer/scripts/bundle-query-cli.js`
- verified: `node -c viewer/scripts/bundle-query-mcp.js`
- verified: `jq empty harness/contracts/*.json`
- verified: `scripts/harness-evidence-promotion-atlas-smoke.sh`
- verified: `scripts/harness-bundle-query-smoke.sh`
- verified: `scripts/harness-bundle-query-mcp-smoke.sh`
- verified: `scripts/harness-portolan-smoke.sh`
- verified: `scripts/build-evidence-promotion-atlas.sh /tmp/portolan-bigtop-20260621-193430`
- verified: `scripts/harness-bigtop-acceptance.sh /tmp/portolan-bigtop-20260621-193430`
- verified: `go test ./...`
- verified: `go vet ./...`
- verified after final documentation update: `git diff --check`

## Bigtop Regression Evidence

- Bundle: `/tmp/portolan-bigtop-20260621-193430`, 1.8G, 18 repos.
- Symbol index: 3,019,203 rows.
- `promotion-health-symbol-index-pollution`: `polluted_by_non_source`,
  observed 2,012,865 / 3,019,203 rows.
- `promotion-health-symbol-index-fixtures`: `dominated_by_fixture_data`,
  observed 1,214,223 / 3,019,203 test/fixture rows.
- `promotion-health-symbol-index-promoted-facts-truncated`: `non_exhaustive`,
  observed 200 / 3,019,203 promoted symbol facts.
- `promotion-health-oversized-family-symbol_index`: `oversized`,
  observed 895,795,098 bytes.

## Decision

Do not merge without an explicit merge command. Separate GitHub code-review
approval is waived for PR #73; it should not be reported as a blocker.
