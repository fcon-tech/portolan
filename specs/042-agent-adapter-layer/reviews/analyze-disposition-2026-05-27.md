# Analyze Disposition - 2026-05-27

Mode: REVIEW

## Analyze Scope

Manual `/speckit-analyze` equivalent for spec 042, covering:

- backlog row vs spec/plan/tasks alignment;
- evidence-state mapping;
- local-first/read-only boundary;
- privacy and fixture safety;
- adapter contract compatibility;
- product wording drift.

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| A-001 | major | The existing adapter contract has only a default evidence state and cannot express producer confidence mappings such as Graphify `EXTRACTED`, `INFERRED`, and `AMBIGUOUS`. | accepted; add a bounded optional confidence map to the adapter contract and validate weak-state mapping. |
| A-002 | major | Full Graphify `graph.json` import would require graph payload parsing, path normalization, and source-range safety beyond the existing adapter contract. | accepted narrower; implement validation/profile behavior only in this slice. |
| A-003 | major | Producer `EXTRACTED` can be misread as Portolan direct source evidence. | accepted; validate and document that Graphify `EXTRACTED` maps to `metadata-visible`, not `source-visible`. |
| A-004 | minor | `docs/product-claims.md` should not broaden OSS composition claims beyond what this slice proves. | accepted; update claims only with narrow Graphify contract-validation wording if verification passes. |

## Verification Expectations

- Focused adapter tests must cover confidence mapping and unsafe mapping rejection.
- `portolan adapter validate --in testdata/oss-adapter-contract/graphify-minimal.json` must pass.
- Baseline checks must include `go test -count=1 ./...`, `jq empty schema/*.json`, and `git diff --check`.

## Blockers

No implementation blocker. Full Graphify import remains out of scope until a separate schema/import spec exists.
