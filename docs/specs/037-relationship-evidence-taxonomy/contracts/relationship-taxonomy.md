# Contract: Relationship Evidence Taxonomy

Generated agent-facing relationship guidance must include these concepts.

## Relationship Kinds

| Kind | Can Say | Must Not Say Without More Evidence |
| --- | --- | --- |
| Dependency | Source or manifest coupling exists. | Runtime communication happened. |
| Declared service/API | A local catalog, contract, diagram, or metadata file declares a relationship. | The declaration is current production behavior. |
| Runtime communication | A local runtime observation shows communication occurred. | Complete topology unless the supplied runtime evidence is complete. |
| Ownership | A local source states responsibility or ownership. | Operational accountability beyond the supplied source. |
| Lifecycle | A local source states active, retired, legacy, or migration status. | Current lifecycle for unobserved systems. |

## Evidence Type Requirements

- Relationship claims must name their evidence type.
- Runtime service topology is `not_assessed` unless runtime-visible inputs are
  supplied and inspected.
- Missing local relationship inputs remain `not_assessed` or `unknown`; they are
  not clean results.
- `cannot_verify` must include the reason evidence could not be validated.
- Product claims about service relationships must cite the artifact or state
  that the surface is `not_assessed`.

## Generated Answer Contract Requirements

`answer-contract.md` must tell agents:

- to separate source dependency, declared service/API, runtime communication,
  ownership, and lifecycle relationships;
- that `source-visible` and `metadata-visible` records cannot prove runtime
  traffic;
- that runtime topology remains `not_assessed` when no runtime observations are
  supplied;
- where to look first: `evidence-index.jsonl`, `tool-registry.json`,
  `gaps.jsonl`, `summary.json`, `graph-index.json`, and `findings.jsonl`.
