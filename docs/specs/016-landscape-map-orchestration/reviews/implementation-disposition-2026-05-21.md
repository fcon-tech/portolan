# Landscape Map Orchestration Implementation Disposition - 2026-05-21

## Scope

Implemented local landscape mapping support for `portolan map --selection`:

- selection parsing for local tool outputs, corpus manifest path, and
  `require_full_corpus`;
- coverage ledger and `coverage.json` artifact;
- multi-repository map orchestration without collapsing repository ids;
- incomplete Bigtop full-corpus gate that blocks before artifact writes when
  active or external manifest repositories are missing;
- reproducible Bigtop selection generation from the committed manifest and a
  local checkout directory;
- local OSS tool-output fixture normalization into graph nodes and findings;
- technical-debt findings derived from weak coverage, duplication, and
  configuration evidence without readiness verdicts;
- CTO packet sections for inventory, repo/product matrix, contracts/surfaces,
  duplication, configuration, legacy/debt, unknowns, and next-agent tasks;
- agent guide, portable skill, Cursor rule, and Bigtop quickstart updates.

## Decision Gate

- Simpler/Faster: Reused the existing map bundle path and relationship detector
  instead of introducing a new command family or external scanner dependency.
- Blocking Edge Cases: Full Bigtop acceptance requires every active/external
  product repository to be local and source-visible. The required repositories
  were prepared under `/Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/repos`
  before the offline `map --selection` run.
- Existing Open Source: The slice imports local OSS tool-output artifacts with
  attribution rather than embedding scanner implementations.

## Review Lanes

| Lane | Status | Result |
| --- | --- | --- |
| `zai/glm-5.1` | reviewed | Minor output/scope and schema questions; no critical or major findings from summary-only review. |
| `minimax/MiniMax-M2.7` | reviewed | Flagged a critical/major concern that blocking before artifacts may reduce auditability, plus ambiguity around `--root`/`--selection` and schema defaults. |
| `kimi-coding/kimi-for-coding` | reviewed after retry | Flagged coverage scope ambiguity and schema compatibility risks from summary-only review. Initial run returned no review because it claimed no summary was provided; treated as degraded and retried. |
| `kimi-coding/kimi-for-coding` rerun after full-corpus fix | not_assessed | Off-task output attempted to inspect files despite `--no-tools`; not counted as review evidence. |
| `minimax/MiniMax-M2.7` rerun after full-corpus fix | not_assessed | Off-task output attempted tool calls despite `--no-tools`; not counted as review evidence. |
| `zai/glm-5.1` rerun after full-corpus fix | not_assessed | Off-task output did not return findings; not counted as review evidence. |
| `openrouter/qwen/qwen3.6-plus` PR review | reviewed | Found major gaps in vacuous full-corpus gate and tool-output fact extraction, plus minor symlink/skipped-surface/count/data-model issues. Accepted and fixed. |
| `openrouter/~google/gemini-pro-latest` PR review | reviewed | No critical/major findings; minor test-coverage note. |
| `openrouter/deepseek/deepseek-v4-pro` PR review | reviewed | Found major gap in tool-output fact extraction and minor gaps in selection not_assessed findings, stable rerun, data-model shape, and manifest validation. Accepted and fixed or dispositioned. |

## Findings Disposition

| Finding | Source | Disposition |
| --- | --- | --- |
| Blocking gate should emit diagnostic artifacts. | minimax | Rejected. FR-005 explicitly requires startup validation to fail without partial output when full-corpus gate checks fail. The CLI error names missing manifest ids; no run artifacts are written. |
| `--root` and `--selection` interaction undefined. | minimax | Accepted and fixed. CLI and maprun reject both flags together; tests cover the mutual exclusion. |
| `require_full_corpus` may break existing selections. | minimax, kimi | Rejected with evidence. The field is optional, defaults to false in Go, and existing selections without the field still validate. |
| Coverage scope may not distinguish subset from full-corpus runs. | kimi | Accepted and fixed. `coverage.json` now includes `scope.selection_path`, `scope.corpus_manifest`, and `scope.require_full_corpus`. |
| Output path and path-safety not assessed. | glm, minimax, kimi | Covered by local tests and existing output validation. Selection map output rejects ancestor/inside-selected-repository unsafe paths by reusing maprun safety patterns. |
| `require_full_corpus` without `corpus_manifest` creates a vacuous passing gate. | qwen | Accepted and fixed. Coverage now emits a blocked corpus-manifest record when `require_full_corpus` is true without a manifest; test added. |
| Tool-output normalization extracts only existence/summary, not facts. | qwen, deepseek | Accepted and fixed. Map now emits graph facts for CycloneDX-style components/dependencies, language inventory, duplication groups, and configuration result groups. Fixtures use representative structured shapes. |
| Repository symlink handling differs from scan. | qwen | Accepted and fixed. Selection map no longer treats repository symlinks as source-visible; test added. |
| Selection path omitted duplication/configuration not_assessed markers. | qwen, deepseek | Accepted and fixed. Selection map now adds not_assessed findings when no observed duplication/configuration surface is selected. |
| Coverage and map packet count agreement was untested. | qwen | Accepted and fixed. Test added for coverage total agreement in `map.md`. |
| Stable rerun counts were untested. | deepseek | Accepted and fixed. Test added for stable coverage summary and findings count across repeated `map --selection` runs. |
| Data model diverged from implemented coverage shape. | deepseek | Accepted and fixed. `data-model.md` now documents `scope`, flat `records[]`, and `summary`. |
| Manifest loader validates only schema_version. | deepseek | Accepted narrower than stated. Full JSON Schema validation is not implemented in Go, but malformed/missing manifest targets now cannot satisfy the full-corpus gate; schema validation remains covered by `jq empty schema/*.json` for committed schemas. |

## Verification

- verified: `go test ./...`
- verified: `jq empty schema/*.json`
- verified: JSON syntax checks for the new landscape and incomplete Bigtop
  fixtures
- verified: `git diff --check`
- verified: `go run ./cmd/portolan map --selection internal/testfixtures/landscape-map/selection.json --out <tmp>/run --force`
- verified: `go run ./cmd/portolan map --selection internal/testfixtures/apache-bigtop-landscape/incomplete-selection.json --out <tmp>/run` exits non-zero, names missing active/external Bigtop repositories, and writes no output directory
- verified: `go run ./cmd/removed Bigtop-specific selection generator --manifest internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json --repo-dir /Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/repos --out /Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/selection.json --force`
- verified: `go run ./cmd/portolan map --selection /Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/selection.json --out /Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/run --force`
- verified: `/Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/run/coverage.json` has `blocked: []`, 15 selected local repository records, and no non-source inventory blockers.
- verified: `/Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/run/` contains `run.json`, `coverage.json`, `graph.json`, `findings.jsonl`, and `map.md`.
- verified: `map.md` contains the CTO packet sections for landscape inventory, repo/product matrix, contracts/surfaces, duplication, configuration, legacy/debt, unknowns, machine artifact summary, and next-agent tasks.
- verified: the full Bigtop `map.md` is bounded to 394 lines; full machine detail remains in `graph.json` and `findings.jsonl`.

## Blockers

- blocked: none for local implementation.
- not_assessed: PR-level review, GitHub checks, and merge readiness.
