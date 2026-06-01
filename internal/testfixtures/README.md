# Test Fixtures Contract

`internal/testfixtures/` contains small, deterministic fixtures for repository-root CLI and
package tests. These files are not product examples, demo outputs, customer
templates, or supported input catalogs.

## Rules

- Keep fixtures local, read-only, and deterministic.
- Prefer small neutral fixtures for ordinary behavior tests.
- Use named real-world stress fixtures only when the target shape matters to the
  test or historical evidence record.
- Document every new top-level fixture directory here when adding it.
- Do not add credentials, private paths, generated run outputs, or unbounded
  external corpora.
- Do not turn a named fixture into default product narrative or CLI behavior.

## Fixture Groups

| Path | Purpose | Product status |
| --- | --- | --- |
| `apache-bigtop-smoke/` | Minimal Apache Bigtop-shaped fixture for old smoke and acceptance preflight records. | Named stress fixture only; not a default workflow. |
| `apache-bigtop-landscape/` | Incomplete Apache Bigtop-shaped landscape selection used to test missing repository coverage failures. | Named negative fixture only. |
| `corpus-manifests/apache-bigtop/` | Apache Bigtop manifest used by historical acceptance and coverage reviews. | Named corpus reference only; not a product catalog. |
| `black-box-profile/` | Selection, metadata, runtime, and claim fixtures for black-box profile behavior. | Test fixture. |
| `configuration-surfaces/` | Small repository fixture for config, env, port, workflow, and secret-reference detection. | Test fixture. |
| `evidence-diff/` | Graph snapshots for evidence diff behavior. | Test fixture. |
| `human-readable-packet/` | Graph fixtures for packet rendering, weak-state visibility, and malformed input handling. | Test fixture. |
| `importer-normalization/` | Local importer fixtures for CycloneDX, Graphify, Repomix, and symbol-index style inputs. | Test fixture. |
| `landscape-map/` | Neutral multi-repository landscape fixture for map/context behavior. | Test fixture. |
| `local-evidence-graph/` | Minimal selection and repository fixture for graph construction. | Test fixture. |
| `map-command/` | Minimal repository fixture for `portolan map --root`. | Test fixture. |
| `oss-adapter-contract/` | Adapter contract JSON fixtures, including invalid network/mutation examples. | Test fixture. |
| `relationship-detection/` | Repository, metadata, and claim fixtures for relationship evidence. | Test fixture. |
| `report-quality/` | Report-quality summaries for accepted and rejected quality-gate behavior. | Test fixture. |
| `selection-inventory/` | Selection validation fixtures for valid, duplicate, missing-path, and network-url cases. | Test fixture. |
| `technical-debt-findings/` | Small repository fixture for technical-debt candidate findings. | Test fixture. |

Package-local fixtures under `internal/*/testfixtures/` exist only when Go
package tests need paths relative to that package. Prefer
`internal/testfixtures/` for shared CLI fixtures.
