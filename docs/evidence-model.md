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

## Initial Graph Shape

The draft graph has:

- nodes: repositories, services, packages, runtime systems, teams, claims;
- edges: owns, depends-on, exposes, imports, observes, claims;
- evidence: state, source, timestamp, confidence reason, and verifier notes.
