# P9 implementation review disposition (specs 104–108) — 2026-06-11

Scope: branch `codex/104-108-p9-cto-landscape` vs `main` (e5358aa),
46 files, +2568/−36. Review planes: evidence-state semantics, claims
tier-laundering, path/output safety, schema compatibility, shell robustness,
viewer correctness.

## Lanes

Roster lanes (pi, per `docs/review-harness-benchmark.md`):

| Lane | Result | Evidence |
|---|---|---|
| `pi zai/glm-5.1` | `not_assessed` | 600s timeout, zero output; retry with short packet 300s timeout, zero output |
| `pi kimi-coding/kimi-for-coding` | `not_assessed` | 300s timeout, zero output |
| `pi` harness smoke (trivial prompt) | failed | 90s timeout, zero output — harness outage, not model evidence |
| `opencode` strict lanes (`zai-coding-plan/glm-5.1`, `minimax/MiniMax-M2.7`, `kimi-for-coding/k2p6`) | blocked | preflight passed (models listed), but `codex-subagent run` crashed (process ended without exit code) and direct `opencode run` hung on a trivial smoke (120–180s timeouts, zero output, `--pure` included). Network to z.ai/openrouter verified OK — local harness outage |

Replacement lanes (explicit, non-GPT, assessed):

| Lane | Harness | Result |
|---|---|---|
| Bugbot review (branch changes, readonly) | Cursor subagent | assessed — 5 findings |
| Security review (branch changes, readonly) | Cursor subagent | assessed — 2 medium findings, clean areas documented |
| Correctness review | Cursor subagent on `composer-2.5` (non-GPT, non-Claude) | assessed — 11 findings |

Replacement rationale: both roster harnesses (`pi`, `opencode`) failed
trivial smokes in this environment; Cursor subagent lanes are the only
operable independent reviewers. Three assessed lanes obtained; all
repo-grounded.

## Findings and dispositions

| # | Finding (lane) | Severity | Disposition |
|---|---|---|---|
| 1 | Empty-string cited_refs satisfy ≥1-ref rule (Bugbot) | high | accepted/fixed — validation now rejects empty strings in `cited_refs`; smoke `claim-bad-3` |
| 2 | `hotspots --repo <unknown>` returns whole landscape with only a warning (Bugbot) | high | accepted/fixed — unknown repo returns 0 records + warning; smoke added |
| 3 | `path:`/`producer_ref:` refs escape roots via `..`/symlinks; absolute `producer_ref` resolves anywhere (Bugbot + Security) | high | accepted/fixed — `file_under_root` canonical containment (readlink -f); `producer_ref` restricted to bundle dir; smokes `claim-bad-4/5` |
| 4 | Malformed line in existing claims.jsonl truncates all other agents' claims on re-import (Bugbot) | high | accepted/fixed — per-line merge preserves unparseable lines; also fixed latent jq context bug (`$agents \| index(.agent)` indexed the array — the agent-preserve branch never worked) |
| 5 | `repos` records flatten unknown activity into observed (Bugbot) | medium | accepted narrower — record keeps artifact-level state; added `activity_evidence_state` so unknown stays visible at record level |
| 6 | Symlinked README/manifest/compose pulls outside-repo content into profiles (Security) | medium | accepted/fixed — `repo_file` containment on all content reads; negative smoke (symlinked README → no leak) |
| 7 | Stale repo-profiles.json survives producer failure (correctness #1) | medium | accepted/fixed — builder removes artifact before run and on failure |
| 8 | Viewer `repoForPath` falls back to `repos[0]` for unmatched relative paths (correctness #5) | medium | accepted/fixed — returns null (unattributed beats wrong) |
| 9 | Viewer absolute-path match is first-prefix, not longest (correctness #6) | medium | accepted/fixed — longest-prefix wins |
| 10 | bundle-query-result schema family enum missing claims/repos/relationships (correctness #8) | medium | accepted/fixed — enum extended |
| 11 | `claims --subject` substring match (`repo:foo` matches `repo:foo-bar`) (correctness #10) | medium | accepted/fixed — exact match; `repo:`/`path:` scheme-prefix filters retained |
| 12 | All-rejected re-import leaves agent's prior claims (correctness #3) | low | accepted/fixed — agents collected from all schema-valid rows; smoke covers purge |
| 13 | Duplicate relationship ids across multiple producer files (correctness #4) | low | accepted/fixed — `unique_by(.id)` before write |
| 14 | Missing-on-disk repos skipped silently in profiles (correctness #2) | low | accepted narrower — stderr warning; bundle-level gap not added (repos.json identity remains) |
| 15 | Stale `selectedRepoId` renders drill with undefined metadata (correctness #7) | low | accepted/fixed — explicit unknown-repo empty state |
| 16 | Invalid `--tier` filter indistinguishable from empty bundle (correctness #11) | low | accepted/fixed — warning emitted |
| 17 | Record `kind` values not enumerated in result schema (correctness #9) | low | rejected — schema has no `kind` enum; `additionalProperties: true` is the extension contract |
| 18 | `compose_services_json` quoting can break on exotic names (correctness residual) | low | unresolved (documented residual) — best-effort metadata; jq failure degrades to `[]`, no crash |
| 19 | Viewer `loadJSONL` crashes on corrupt line (correctness residual) | low | unresolved (documented residual) — pre-existing pattern shared by all jsonl loads, not introduced by P9 |

## Verification after fixes

- `harness-cross-repo-smoke.sh` — ok (now includes: empty-string ref,
  traversal `path:` ref, outside-bundle `producer_ref`, all-rejected
  re-import purge, symlinked README containment)
- `harness-bundle-query-smoke.sh` — ok (now includes unknown `--repo` → 0
  records + warning)
- `harness-bundle-query-mcp-smoke.sh`, `harness-portolan-smoke.sh` — ok
- `go test ./...`, `jq empty` on all schemas/contracts, `git diff --check` — ok

Tier-laundering invariant re-checked after fixes: claims stay
`claim-only`, never enter ranked findings, badges mandatory, importer never
raises tier, refs now canonically contained.

## Focused re-review of the fix commit (6145d5b)

Lane: correctness reviewer resumed on `composer-2.5` over `git show 6145d5b`
plus current files. Verdict: all six targeted areas fixed; two low follow-ups.

| Follow-up | Disposition |
|---|---|
| `main.go`/`main.py` entrypoint detection still used `[[ -f ]]` instead of `repo_file` | accepted/fixed — consistency change (existence-only label, no content read) |
| Import file containing only schema-invalid rows does not purge that agent's prior claims | rejected — schema-invalid rows cannot be trusted to name an agent; letting a malformed file trigger deletion would be a destruction vector. Purge boundary stays at schema-valid rows (rows rejected later for subject/ref reasons do purge) |

Residual notes carried (UX inconsistency: `repos`/`relationships` unknown
`--repo` returns 0 records without the explicit warning `hotspots` emits;
viewer `loadJSONL` strictness — both pre-existing patterns, not P9
regressions).
