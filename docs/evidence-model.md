# Evidence Model

Portolan uses evidence state as a first-class field. The state describes why a
fact is present in the graph and how directly it was observed.

## States

| State | Meaning |
| --- | --- |
| `source-visible` | Source files were inspected directly. |
| `metadata-visible` | Metadata, exported inventory, manifests, or tool output were inspected. |
| `runtime-visible` | Runtime observation, telemetry, or execution evidence was inspected. |
| `claim-only` | A human or tool claim exists, but Portolan did not verify it directly. |
| `unknown` | No usable evidence was available. |
| `cannot_verify` | Evidence was present, but Portolan could not validate it. |

## Rules

- `unknown` is not failure by itself; it is a visible map gap.
- `claim-only` is not equivalent to observed evidence.
- `cannot_verify` must include a reason.
- Derived summaries must preserve the weakest relevant evidence state.
- Human-readable packets must be generated from the same graph as machine output.

## Relationship Evidence Taxonomy

Relationship claims have two separate axes: what relationship is being claimed,
and what local evidence supports it. Reports must keep both axes visible.

| Relationship kind | Evidence type | Can say | Must not claim |
| --- | --- | --- | --- |
| Source dependency | `source-visible` or `metadata-visible` | Local source or manifest coupling exists. | Runtime communication, service topology, or production behavior. |
| Declared service/API | `metadata-visible` | A local catalog, contract, diagram, manifest, or imported tool output declares intended architecture. | That the declaration is current production behavior. |
| Runtime communication | `runtime-visible` | Local runtime evidence shows communication during the captured window. | Complete topology unless the supplied runtime evidence is complete. |
| Ownership | `metadata-visible` or `claim-only` | A local source states team or system responsibility. | Operational accountability beyond the supplied source. |
| Lifecycle | `metadata-visible` or `claim-only` | A local source states active, retired, legacy, or migration status. | Current lifecycle for unobserved systems. |

Runtime topology is `not_assessed` when no local runtime observations were
supplied. A missing relationship surface is not a clean result; keep it as
`unknown`, `cannot_verify`, or `not_assessed` with the reason.

## Initial Graph Shape

The draft graph has:

- nodes: repositories, services, packages, runtime systems, teams, claims;
- edges: owns, depends-on, exposes, imports, observes, claims;
- evidence: state, source, timestamp, confidence reason, and verifier notes.
