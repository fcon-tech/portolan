# Contract: Agent Adapter Layer

## Candidate Evaluation

Each candidate evaluation must include:

- license;
- maintenance;
- local execution;
- privacy posture;
- format stability;
- adapter cost;
- evidence-state mapping;
- final decision.

## Graphify Mapping

Graphify-style confidence maps conservatively:

| Producer confidence | Portolan state |
| --- | --- |
| extracted from producer output | `metadata-visible` |
| inferred | `claim-only` |
| ambiguous | `cannot_verify` |
| missing source/provenance | `cannot_verify` |

This mapping does not make a fact `source-visible`; Portolan must inspect source directly for that.

## Profile Contract

Profiles for SCIP/Serena and Repomix may be documentation-only in this slice, but must name supported fields and explicitly mark unsupported semantic claims.
