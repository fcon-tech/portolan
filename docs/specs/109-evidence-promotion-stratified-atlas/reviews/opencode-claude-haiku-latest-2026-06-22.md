# OpenCode Review: Claude Haiku Latest

Date: 2026-06-22
Lane: `openrouter/~anthropic/claude-haiku-latest`
Run: `.codex-subagents/runs/run_GV425Lcgoo/status.json`
Scope: PR #73, branch `codex/109-evidence-promotion-stratified-atlas`

## Result

Assessed. The lane completed with exit code 0 and produced grounded review
output for commit `89959f6`.

## Findings

- Minor: symbol-index promoted facts accepted producer-supplied
  `evidence_state` without validating it against the Portolan evidence-state
  enum. A malformed external producer row could leak an invalid state into
  `promoted-facts.jsonl` before schema validation caught it.

## Disposition

- Accepted and fixed: symbol-index promoted facts now normalize producer
  `evidence_state` through the allowed enum and fall back to
  `metadata-visible`.
- Accepted and fixed: `scripts/harness-evidence-promotion-atlas-smoke.sh`
  appends a malformed temp-bundle symbol row and verifies the promoted fact
  uses `metadata-visible`.

## Follow-up State

This lane counts as the third assessed independent non-GPT review lane. No
blocking findings remain from the three assessed lanes.
