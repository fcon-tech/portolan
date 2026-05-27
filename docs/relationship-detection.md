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

## Product Taxonomy

Portolan reports relationship claims by relationship kind and evidence type.
The same pair of endpoints can have multiple records when different evidence
types support different claims.

| Relationship kind | Evidence type | Can say | Must not claim |
| --- | --- | --- | --- |
| Source dependency | `source-visible` or `metadata-visible` | Local source or manifest coupling exists. | Runtime communication, service topology, or production behavior. |
| Declared service/API | `metadata-visible` | A local catalog, contract, diagram, manifest, or imported tool output declares intended architecture. | That the declaration is current production behavior. |
| Runtime communication | `runtime-visible` | Local runtime evidence shows communication during the captured window. | Complete topology unless the supplied runtime evidence is complete. |
| Ownership | `metadata-visible` or `claim-only` | A local source states team or system responsibility. | Operational accountability beyond the supplied source. |
| Lifecycle | `metadata-visible` or `claim-only` | A local source states active, retired, legacy, or migration status. | Current lifecycle for unobserved systems. |

Questions such as "what talks to what?" must name which relationship kind is
being answered. Source imports and `go.mod` dependencies can answer dependency
questions. They cannot answer runtime service topology questions. Runtime
topology remains `not_assessed` unless local runtime observations are supplied
and inspected.

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
