# Tasks: Scope Completeness Validation

## Slice 1: Inventory Classification

- [x] T001 Add focused coverage tests for selected-but-unexpected repositories
      classified as `extra`.
- [x] T002 Update coverage classification to emit `extra` records for local
      selected repositories absent from the supplied corpus manifest.
- [x] T003 Update `schema/coverage.schema.json` to allow the `extra` status.

## Slice 2: User-Facing Map Evidence

- [x] T004 Add or update app-level map tests showing `summary.json.coverage`
      and `map.md` preserve extra/missing/unknown scope records.
- [x] T005 Ensure weak coverage summaries include `extra` records.

## Slice 3: Documentation And Status

- [x] T006 Update agent/product docs so local scope and complete inherited
      estate coverage are not interchangeable.
- [x] T007 Update `docs/product-backlog.md`, this task ledger, and review
      disposition after verification.

## Verification

- [x] V001 `go test -count=1 ./...`
- [x] V002 `jq empty schema/*.json`
- [x] V003 `git diff --check`
- [x] V004 `go run ./cmd/portolan map --root <fixture> --out <tmp> --force`
