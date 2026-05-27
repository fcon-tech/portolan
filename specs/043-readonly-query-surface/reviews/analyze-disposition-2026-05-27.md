# Analyze Disposition

Spec: `specs/043-readonly-query-surface/`
Date: 2026-05-27
Reviewer: Codex local repo-grounded lane

## Analyze Scope

Compared:

- `docs/product-backlog.md` P5-043 row
- `spec.md`
- `plan.md`
- `research.md`
- `data-model.md`
- `contracts/query-surface.md`
- `quickstart.md`
- `tasks.md`
- existing `internal/app` command patterns
- existing `internal/graphslice` bounded bundle behavior
- map bundle artifacts produced by `internal/maprun`

## Findings And Disposition

1. Finding: `query gaps` needs a source for `not_assessed`, but `coverage.json` mainly uses evidence states such as `unknown` and `cannot_verify`; `not_assessed` is commonly emitted through `findings.jsonl`.
   Disposition: accepted. Implement `gaps` over both `coverage.json` weak records and weak `findings.jsonl` records.

2. Finding: output should be stdout JSON, while `graph slice` writes to an explicit `--out` file.
   Disposition: accepted. Query commands are read-only and write only to stdout; no output path, no target mutation.

3. Finding: contract requires stable `portolan://` references and the data model separately asks for bundle path, artifact, and record ID.
   Disposition: accepted. Include both a string `reference` and explicit `bundle_path`, `artifact`, and `record_id` fields in each record.

4. Finding: the slice must not introduce daemon behavior or MCP runtime.
   Disposition: accepted. MCP remains deferred documentation/contract only.

5. Finding: missing or malformed bundle files could otherwise produce misleading empty output.
   Disposition: accepted. Required artifact read/parse failures will return CLI errors without JSON partial success.

## Not Assessed

- pi/model review lanes are not part of this analyze artifact; they will be run or recorded in the slice review disposition after implementation.
- GitHub PR state and checks are not assessed before a branch commit exists.

Conclusion: no blocking analyze findings remain before test-first implementation.
