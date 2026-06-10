# PR #64 review disposition — 2026-06-10

- **PR**: https://github.com/fcon-tech/portolan/pull/64
- **Branch**: `codex/087-091-harness-pivot`
- **Specs**: 087–091 (umbrella ship)

## Review lanes

| Lane | Requested model | Status | Verdict |
| --- | --- | --- | --- |
| requirements | `zai-coding-plan/glm-5.1` | `not_assessed` (codex-subagent/opencode hung) | — |
| requirements (replacement) | `ce-correctness-reviewer` | assessed | partial → fixed |
| code | `kimi-for-coding/k2p6` | `not_assessed` (opencode timeout) | — |
| code (replacement) | `ce-maintainability-reviewer` | assessed | partial → fixed |
| security | `minimax/MiniMax-M2.7` | `not_assessed` (codex-subagent crash) | — |
| security (replacement) | `ce-security-reviewer` | assessed | partial → P0 fixed |
| repo-grounded local | this session | assessed | fixes verified |

**Assessed independent non-GPT coverage**: 3 replacement lanes + local verification (requested OpenCode lanes degraded).

## Fixes applied (review-fix pass)

1. Symlink escape on viewer `/source` (SEC-001)
2. dep-hub schema conformance: sentinel path (REQ-002)
3. Shard gaps use `cannot_verify` status (REQ-003)
4. Gap budget top-20 with manifest `gaps_truncated` (REQ-001)
5. Wizard flag arity validation + numeric budget checks
6. Semgrep fail-closed without local rules (REQ-007)
7. dep-hub visible under repo filters
8. Smoke: record schema checks + symlink 403 test

## Deferred (documented, not blocking draft→ready)

- Extended viewer UX smoke (filters, heat tree, banners) — REQ-005
- Full bigtop / wizard orchestration in CI — REQ-006
- `hotspots-full.jsonl` in spec 088 layout — REQ-008
- repo_slug collision on duplicate basenames
- `eval` in install_tool (hardcoded only)

## Verification (post-fix)

```text
scripts/harness-orient-smoke.sh — ok
go test ./... — ok
```

GitHub CI on PR head: re-run after push (prior run green on pre-fix head).

## Readiness

`/speckit-pr-readiness-closeout` may run after CI on fix commit is green. PR remains **draft** until closeout passes.
