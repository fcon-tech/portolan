# Contract: Producer Family Evaluation

This contract defines the machine-readable shape for producer-family
recommendation and evaluation records. The exact output file may be introduced
as `producer-recommendations.jsonl` or folded into `evidence-index.jsonl`, but
the fields below are required for the first implementation.

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
  "candidate_tools": ["scip", "lsif", "serena", "sourcebot", "zoekt"],
  "source_artifact": "gaps.jsonl",
  "reason": "No selected local symbol/reference producer output is present; candidates are options, not verified support."
}
```

Rules:

- `kind` MUST be `producer-recommendation`.
- `status` MUST remain `not_assessed`, `unknown`, `cannot_verify`,
  `blocked`, or `partial` unless a normalized local producer output exists.
- `candidate_tools` MUST NOT imply support by itself.
- `reason` MUST name the evidence gap and preserve the weak state.

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
- Network, credentials, daemon behavior, target mutation, or source export
  risks MUST be represented in `privacy`, `local_execution`, `notes`, or a
  future structured `boundary_risks` field.

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
  "reason": "No local symbol-index output covers this repository."
}
```

Rules:

- Coverage must be scoped to a repository, subdirectory, landscape, or unknown
  scope.
- Partial coverage must not be promoted to repository-wide or landscape-wide
  coverage.
- Runtime coverage requires runtime-visible local observations.
