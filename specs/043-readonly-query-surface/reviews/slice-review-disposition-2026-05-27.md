# Slice Review Disposition

Spec: `specs/043-readonly-query-surface/`
Date: 2026-05-27
Branch: `codex/043-readonly-query-surface-delivery`

## Local Review

Scope reviewed:

- read-only bundle query behavior in `internal/query/`
- CLI wiring in `internal/app/`
- query docs in `README.md` and `docs/agent/QUICKSTART.md`
- evidence-state and weak/gap semantics
- path safety for bundle and artifact reads
- focused tests and quickstart smoke

Verdict: no blocking findings remain.

## Independent Review Lanes

Enabled model IDs were checked in `~/.pi/agent/settings.json`.

### Initial review pass

- `openrouter/deepseek/deepseek-v4-pro`: assessed. Minor findings around MCP placeholder semantics, exact reference docs, and schema validation.
- `kimi-coding/kimi-for-coding`: assessed with caveats. It requested direct source for some checks; concrete concerns were symlink handling, EOF/trailing JSON, URI escaping, and pagination.
- `zai/glm-5.1`: assessed. Minor findings around default `claim-only` gap inclusion, symlink error clarity, missing finding kind handling, and MCP placeholder semantics.

### Disposition And Fixes

- accepted/fixed: removed MCP placeholder field from query JSON output. MCP remains documented as deferred contract only.
- accepted/fixed: default `query gaps` now includes `unknown`, `cannot_verify`, `not_assessed`, and statuses `missing`/`blocked`; `claim-only` remains available through `query findings` by kind.
- accepted/fixed: symlink errors now include the offending path for bundle and artifact checks.
- accepted/fixed: findings JSONL records now require non-empty `id` and `kind`.
- accepted/fixed: added test coverage for percent-escaped `portolan://` references.
- accepted/fixed: explicit CLI `--limit 0` is rejected; omitted limit still defaults to 20.
- rejected: adding pagination. The first query surface is intentionally bounded and non-paginated; full extraction remains `findings.jsonl`/`graph.json`.
- rejected: allowing symlinked bundles or artifacts. The stricter local read boundary is safer for this slice.
- rejected: adding a new JSON schema validator dependency. The slice uses focused Go contract tests and existing `jq empty schema/*.json`; dependency review is out of scope.

### Focused re-review after fixes

- `openrouter/deepseek/deepseek-v4-pro`: assessed; no actionable findings. Residual risks: future coverage schema compatibility, no findings schema version, large-bundle performance.
- `kimi-coding/kimi-for-coding`: assessed; no actionable findings. Residual risks: `claim-only` default behavior may surprise some users; TOCTOU window accepted for local CLI; one cosmetic `omitempty` concern rejected because the fields already use `omitempty`.
- `zai/glm-5.1`: assessed; no actionable findings. Residual risks: duplicate IDs are scoped by artifact; large-bundle performance remains future work.

## Not Assessed

- PR state: not_assessed; no PR was created in this local branch delivery.
- GitHub checks: not_assessed; no PR checks were run.
- Runtime MCP behavior: not_assessed and intentionally out of scope.

Conclusion: accepted findings are fixed and focused re-review found no actionable remaining issues.
