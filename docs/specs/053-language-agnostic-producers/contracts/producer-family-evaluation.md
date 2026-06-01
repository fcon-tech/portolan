# Contract: Producer Family Evaluation

This contract defines the machine-readable shape for producer-family
recommendation and evaluation records. The implementation must provide a JSON
Schema or equivalent allow-listed validator for these record kinds before any
agent-facing artifact consumes them. The exact output file may be introduced as
`producer-recommendations.jsonl` or folded into `evidence-index.jsonl`, but the
fields below are required for the first implementation.

## Field Semantics

- `status`: operational coverage or recommendation state for the producer
  family in a repository, directory, component, or landscape scope.
- `evidence_state`: Portolan evidence strength/state. It must preserve
  `source-visible`, `metadata-visible`, `runtime-visible`, `claim-only`,
  `unknown`, `cannot_verify`, or `not_assessed`.
- `candidate_tools`: option records only. Tool names must never be represented
  as plain strings because consumers can drop surrounding disclaimers.
- `verification_state`: whether a candidate has local evidence. Default is
  `not_assessed`.
- `support_state`: whether Portolan can recommend the candidate as supported.
  Default is `candidate_only`.

## Recommendation Record

```json
{
  "id": "producer-recommendation-landscape-symbol-index",
  "kind": "producer-recommendation",
  "family": "symbol-index",
  "status": "not_assessed",
  "evidence_state": "not_assessed",
  "repositories": ["api", "worker"],
  "blocked_claims": [
    "symbol/reference relationships",
    "complete call graph"
  ],
  "required_output": "local symbol-index export",
  "candidate_tools": [
    {
      "id": "scip",
      "verification_state": "not_assessed",
      "support_state": "candidate_only",
      "reason": "Listed as an option only; no local output was reviewed."
    },
    {
      "id": "serena",
      "verification_state": "not_assessed",
      "support_state": "candidate_only",
      "reason": "Listed as an option only; no local export or MCP behavior was reviewed."
    }
  ],
  "source_artifact": "gaps.jsonl",
  "reason": "No selected local symbol/reference producer output is present; candidates are options, not verified support."
}
```

Rules:

- `kind` MUST be `producer-recommendation`.
- `status` MUST remain `not_assessed`, `unknown`, `cannot_verify`,
  `blocked`, or `partial` unless a normalized local producer output exists.
- `candidate_tools` MUST be objects with `verification_state` and
  `support_state`; plain string lists are invalid.
- `support_state` MUST stay `candidate_only` unless a separate evaluation
  record accepts or narrows the candidate with local evidence.
- `reason` MUST name the evidence gap and preserve the weak state.
- Recommendation records MUST NOT contain runtime topology or native language
  semantic fields. The validator should reject undeclared fields.

## Evaluation Record

```json
{
  "id": "producer-evaluation-scip-symbol-index",
  "kind": "producer-evaluation",
  "candidate_id": "scip",
  "family": "symbol-index",
  "decision": "not_assessed",
  "fit": "potential symbol/reference producer",
  "output_contract_stability": "not_assessed",
  "local_execution": "not_assessed",
  "license": "not_assessed",
  "maintenance": "not_assessed",
  "privacy": "not_assessed",
  "integration_cost": "unknown",
  "evidence_source": "not_assessed",
  "notes": "Candidate listed for evaluation only; no local output was reviewed."
}
```

Rules:

- `decision` MUST be one of `accepted`, `narrowed`, `rejected`, `blocked`, or
  `not_assessed`.
- `accepted` and `narrowed` decisions MUST cite a local evidence source.
- `rejected` and `blocked` decisions MUST name the blocking boundary or fit
  problem.
- `integration_cost` MUST be `low`, `medium`, `high`, `unknown`, or
  `not_assessed`. Use `not_assessed` when no evaluation has occurred; use
  `unknown` only when evaluation occurred but cost could not be estimated.
- Network, credentials, daemon behavior, target mutation, or source export
  risks MUST be represented in `privacy`, `local_execution`, `notes`, or a
  future structured `boundary_risks` field.
- Portolan may validate and surface evaluation records in this slice, but it
  must not autonomously score, rank, probe, install, or run candidate producer
  tools.

## Coverage Matrix Record

```json
{
  "id": "producer-coverage-api-symbol-index",
  "kind": "producer-coverage",
  "repository_id": "api",
  "family": "symbol-index",
  "status": "not_assessed",
  "evidence_state": "not_assessed",
  "source_artifact": "gaps.jsonl",
  "scope": "repository",
  "scope_detail": "api",
  "languages_in_scope": [],
  "reason": "No local symbol-index output covers this repository."
}
```

Rules:

- Coverage must be scoped to a repository, subdirectory, landscape, or unknown
  scope.
- `scope_detail` SHOULD name the repository id, directory path, component, or
  other bounded unit when coverage is partial.
- `languages_in_scope` MAY list language families covered by the producer
  output. An empty list means language coverage is not assessed, not that all
  languages are covered.
- Partial coverage must not be promoted to repository-wide or landscape-wide
  coverage.
- Runtime coverage requires runtime-visible local observations.

## State Transition Rules

- `not_assessed` stays `not_assessed` when Portolan only recommends a producer
  family.
- `not_assessed` may become `partial` only when a local normalized producer
  output or accepted/narrowed evaluation record scopes coverage to a bounded
  repository, directory, component, or language subset.
- `partial` may become `observed` only for the exact scope covered by local
  normalized producer output.
- `cannot_verify` is used when a producer output or evaluation artifact exists
  but cannot be parsed, scoped, trusted, or validated.
- No recommendation or evaluation transition may create runtime topology
  coverage without runtime-visible local observations.
