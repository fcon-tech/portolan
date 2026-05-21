# Relationship Detection

Portolan relationship detection is local-first and evidence-state preserving.
The first implementation runs inside `portolan map --root <dir> --out <dir>`.

## Supported In V1

| Input family | Relationship | Graph edge | Evidence state | Notes |
| --- | --- | --- | --- | --- |
| Go source files | Source file imports package | `imports` | `source-visible` | Parsed from local `*.go` files with Go's parser. |
| Go module manifests | Module requires dependency module | `depends-on` | `metadata-visible` | Parsed from local `go.mod` bytes with `golang.org/x/mod/modfile`. |
| Existing claim files through `scan --selection` | Claimed relationship | `claims` or claim-backed relationship edge | `claim-only` | Preserved as claim evidence; not upgraded by map detection. |
| Existing black-box metadata through `scan --selection` | Declared dependency or ownership | `depends-on`, `owns`, or `unknown` | `metadata-visible` or `unknown` | Preserved from black-box profile inputs. |

## Not Assessed In V1

- Non-Go source relationship detection.
- Runtime relationship inference.
- Service-topology inference from names, directories, ports, or package labels.
- Lifecycle modeling for retired or legacy projects.
- Relationship inference from network calls, module resolution, package proxy
  lookups, daemons, credentials, or live infrastructure.

Unsupported relationship families are not clean results. They remain
`not_assessed` or future backlog work.

## Evidence Rules

- `imports` edges flow from the local source file to the imported package.
- `depends-on` edges flow from the local module to the required dependency.
- Every relationship edge includes `evidence.state` and `evidence.source`.
- Parse or read failures become `cannot_verify` findings; they do not turn the
  whole map into a success or failure verdict.
- Claims remain `claim-only` even when observed source or metadata evidence
  exists for a similar relationship.
