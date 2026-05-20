# Implementation Review Disposition: 009 Map Command Artifacts

Date: 2026-05-20

## Local Verification

| Check | Status | Evidence |
| --- | --- | --- |
| Focused map tests | verified | `go test ./internal/app -run 'TestRunMap'` passed after implementation. |
| Full Go tests | verified | `go test ./...` passed. |
| Fixture command | verified | `go run ./cmd/portolan map --root testdata/map-command/repo --out /tmp/portolan-map-run --force` wrote the bundle. |
| JSON artifacts | verified | `jq empty /tmp/portolan-map-run/run.json /tmp/portolan-map-run/graph.json` passed. |
| JSONL findings | verified | Each line in `/tmp/portolan-map-run/findings.jsonl` parsed with `jq empty`. |
| JSON/schema syntax | verified | `jq empty schema/*.json corpora/apache-bigtop/manifest.json` passed. |
| Whitespace | verified | `git diff --check` passed. |

## Review Lanes

| Lane | Status | Notes |
| --- | --- | --- |
| `minimax/MiniMax-M2.7` | verified | Found symlink containment, confidence assertion, finding enum validation, dead field, and redundant mkdir findings. |
| `zai/glm-5.1` | verified | Found output replace and source readability concerns plus minor validation/dead field issues. |
| `kimi-coding/kimi-for-coding` | verified | Returned late with additional output safety findings. |
| `minimax/MiniMax-M2.7` focused re-review | verified | Re-reviewed accepted fixes and reported no remaining findings. |

## Findings And Disposition

| Finding | Source | Disposition |
| --- | --- | --- |
| Output path symlink components could bypass the `.portolan` containment gate. | minimax | Accepted and fixed. `validateStartup` now resolves the output parent before containment checks, and a regression test covers symlinked output inside root outside `.portolan`. |
| JSONL confidence field test was vacuous. | minimax | Accepted and fixed. Test now requires numeric `confidence`. |
| Finding validation only checked non-empty strings. | minimax | Accepted and fixed. `validateFinding` now checks finding kind, severity, evidence state, status, and confidence range. |
| `Options.Command` was dead code. | minimax, glm | Accepted and fixed by removing the unused field. |
| Root source visibility could be overclaimed if readability changed after validation. | glm | Accepted narrower than stated. Startup validation now reads the root directory before claiming `source-visible`. Mid-run filesystem races remain a normal local CLI residual risk. |
| Force replace can lose the previous bundle if final rename fails after `RemoveAll`. | glm | Deferred as residual risk. The first slice validates and writes into a sibling temp dir before replacement; transactional backup/rollback is out of scope for this small local command and can be revisited if failures appear in practice. |
| Canonical `--out .portolan/run` fails on first use when `.portolan` does not exist. | kimi | Accepted and fixed. Output path resolution now resolves the nearest existing parent, creates missing parents after safety validation, and test coverage exercises first-use `.portolan/run`. |
| Dangerous broad output paths combined with `--force` can remove too much. | kimi | Accepted and fixed. Startup validation now rejects broad unsafe paths such as the mapped root itself, and test coverage exercises this case. |
| Force replace can lose the previous bundle if final rename fails after deletion. | kimi | Accepted and fixed narrower than stated. Replacement now renames an existing output to a backup, renames the temp bundle into place, and restores the backup if the final rename fails. |
| Walk errors are silently dropped. | kimi | Accepted and fixed. Walk errors now become run metadata warnings. |
| Nested `.portolan` directories are not excluded. | kimi | Accepted and fixed. Any path component named `.portolan` is pruned from inventory. |
| `packet-render` is not an evidence surface. | kimi | Accepted and fixed. It was removed from `enabled_surfaces`; the enabled surface is `source-inventory`. |
| Broad writable directories such as `/tmp` are not rejected with `--force`. | qwen | Accepted and fixed. The safety guard now rejects the system temp directory itself, while still allowing explicit child paths such as `/tmp/portolan-map-run`. |
| Missing `--root` and `--out` were not covered at CLI level. | qwen | Accepted and fixed. Integration tests now cover both missing required flags. |
| Duplicate fixture trees existed under package-local and repo-level `testdata`. | deepseek, gemini | Accepted and fixed. App tests now reference the repo-level fixture with `../../testdata/map-command/repo`; the duplicate package-local fixture was removed. |
| `graph.json` may lack `schema_version`. | deepseek | Rejected with local evidence. `graph.New()` sets `SchemaVersion`, and CLI verification parses `/tmp/portolan-map-run/graph.json` with `jq`; app tests also assert graph schema shape. |

## Residual Risk

The first map command intentionally emits basic source inventory plus
`not_assessed` detector findings. Relationship, duplication, configuration, and
technical-debt detectors remain future specs; their absence must not be read as
clean results. Artifact paths in `run.json` are absolute for auditability in
the producing workspace; if bundles are moved, those self-references can become
stale.
