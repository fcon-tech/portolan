# Data Model: Relationship Evidence Taxonomy

## Relationship Claim

- `subject`: repository, service, package, component, runtime system, team, or
  claim node.
- `object`: related entity.
- `relationship_kind`: dependency, declared service/API, runtime communication,
  ownership, lifecycle, or unsupported/unknown.
- `evidence_type`: `source-visible`, `metadata-visible`, `runtime-visible`,
  `claim-only`, `unknown`, `cannot_verify`, or `not_assessed`.
- `source`: local file, generated artifact, imported tool output, runtime
  export, or claim file.
- `limitation`: what the claim cannot prove.

## Relationship Kind

- `dependency`: code or manifest coupling such as imports and package/module
  requirements.
- `declared-service-api`: local metadata describing an intended service/API
  contract or catalog relationship.
- `runtime-communication`: local runtime observation that communication
  happened during execution.
- `ownership`: team or system responsibility evidence.
- `lifecycle`: active, retired, legacy, or migration state.
- `unsupported-unknown`: a question that Portolan did not assess or cannot
  verify from supplied inputs.

Implementation-facing identifiers may use slug form. Product-facing reports
must render these as Source dependency, Declared service/API, Runtime
communication, Ownership, Lifecycle, or Unsupported/unknown.

## Stakeholder Question

- `question`: plain-language question, such as "what talks to what?"
- `answerable_by`: allowed relationship kinds and evidence types.
- `not_answerable_by`: evidence that must not be used to answer the question.
- `required_limitation`: statement that must appear when evidence is absent.

## State Rules

- `source-visible` dependency evidence can show code-level or manifest-level
  coupling, not production traffic.
- `metadata-visible` declared relationships can show intended architecture,
  not actual runtime behavior.
- `runtime-visible` evidence is required before claiming runtime
  communication.
- `claim-only` evidence remains a claim even when similar observed evidence
  exists elsewhere.
- `not_assessed` is the correct state when a relationship surface was not run or
  no relevant local input was supplied.
- `cannot_verify` requires a reason when evidence was present but invalid or
  unreadable.
