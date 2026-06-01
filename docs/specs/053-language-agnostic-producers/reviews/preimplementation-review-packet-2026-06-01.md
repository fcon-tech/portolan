# Pre-Implementation Review Packet

Date: 2026-06-01

Spec: `docs/specs/053-language-agnostic-producers/`

Branch: `codex/053-language-agnostic-producers`

Review plane: requirements fit, product-boundary fit, evidence-state honesty,
SpecKit completeness, stacked-branch risk, and implementation readiness.

## Current Branch And PR State

- 053 branch head: `c8b05149888b5c8cc774d7c55735c30fbc6d64d3`
- 053 is stacked on PR #29/spec 052 head:
  `27ccbb95199b7fc021d85f55098f1df40fd41537`
- 053 merge-base with `origin/codex/052-dependency-symbol-evidence-import`:
  `27ccbb95199b7fc021d85f55098f1df40fd41537`
- 053 merge-base with `origin/main`:
  `eb2602f363b64d44fe748b65caa5346ae6be78ce`
- PR #29 is open, non-draft, `mergeStateStatus=CLEAN`, checks pass, but
  GitHub review approval and merge approval are absent.

## Spec Direction

Spec 053 answers the question: if Portolan sees PHP, JVM, Scala, TypeScript,
shell, deployment, or mixed-language surfaces, should it write one adapter per
language?

The proposed answer is no. Portolan should recommend and evaluate local
producer families by evidence need:

- dependency/component
- symbol/reference
- API/catalog
- deployment/model
- static finding
- duplication
- config
- runtime observation

The implementation should produce machine-readable recommendation/evaluation
records and answer-contract guardrails. It should not add network access,
daemons, credentials, target mutation, source export, new scanner dependencies,
or per-language scanner ownership.

## Key Requirements

- FR-001: future language coverage is evidence-family coverage, not
  Portolan-owned adapters per language.
- FR-002: maintain a producer-family recommendation surface mapping blocked
  claims to needed local producer families.
- FR-004: recommendations preserve current weak states until local producer
  output is present and normalized.
- FR-005: candidate tools/formats are options, not verified support, unless
  evaluation evidence exists.
- FR-006: producer evaluation records fit, output contract stability, local
  execution, license, maintenance, privacy, integration cost, and boundary
  risks.
- FR-007: risky producer defaults are rejected, blocked, or narrowed before
  default recommendation.
- FR-008: mixed-language coverage is reported by repository and evidence
  family, including partial/off-scope coverage.
- FR-009/FR-010: no runtime topology or native language-semantics claims from
  dependency, symbol, manifest, catalog, or recommendation records alone.

## Contract Shape

Recommendation record:

```json
{
  "kind": "producer-recommendation",
  "family": "symbol-index",
  "status": "not_assessed",
  "evidence_state": "not_assessed",
  "blocked_claims": ["symbol/reference relationships", "complete call graph"],
  "candidate_tools": ["scip", "lsif", "serena", "sourcebot", "zoekt"],
  "reason": "No selected local symbol/reference producer output is present; candidates are options, not verified support."
}
```

Evaluation record:

```json
{
  "kind": "producer-evaluation",
  "candidate_id": "scip",
  "family": "symbol-index",
  "decision": "not_assessed",
  "output_contract_stability": "not_assessed",
  "local_execution": "not_assessed",
  "license": "not_assessed",
  "maintenance": "not_assessed",
  "privacy": "not_assessed",
  "integration_cost": "unknown",
  "evidence_source": "not_assessed"
}
```

Coverage record:

```json
{
  "kind": "producer-coverage",
  "repository_id": "api",
  "family": "symbol-index",
  "status": "not_assessed",
  "evidence_state": "not_assessed",
  "scope": "repository",
  "reason": "No local symbol-index output covers this repository."
}
```

## Product Boundary

Relevant constraints from repo surfaces:

- Portolan is a local, read-only navigation harness, not a coding harness,
  report generator, enterprise code-intelligence replacement, service catalog,
  observability platform, modernization tool, or readiness gate.
- A plan to run a scanner is not evidence.
- Candidate OSS tools are useful only when installed locally, explicitly
  approved, saved, normalized, and assigned evidence states.
- Runtime service topology remains `not_assessed` without runtime-visible
  local observations.
- Broad OSS producer value, SCIP protobuf/real indexer output, real Serena
  export/MCP behavior, Sourcebot/Zoekt behavior, and Graphify MCP/dashboard
  behavior remain `not_assessed` unless locally evaluated.

## Tasks Proposed

- Setup/reviews: requirements/product-vision drift review, analyze/manual
  consistency disposition, stacked-branch status.
- Foundational contract: fixtures, schema/contract expectations,
  answer-contract wording.
- US1: producer-family recommendations for blocked claims.
- US2: producer candidate evaluation records and risky-default handling.
- US3: coverage matrix by repository and producer family.
- Final: focused tests, baseline checks, context help, optional Cursor +
  Composer 2.5 clean-start stress lane, status closeout.

## Local Review Notes

- The spec direction aligns with the user correction: a JVM adapter is not the
  default strategy.
- The biggest risk is support overclaiming: candidate tool names could be read
  as verified support unless records and answer-contract text repeat that they
  are options.
- The second risk is stacked implementation: PR #29 is ready-for-review but not
  merged. Implementation on this branch would create a stacked PR unless PR #29
  merges first.
- No implementation should start until this review is dispositioned and the
  branch policy is recorded.

## Required Reviewer Output

Return:

- findings ordered by severity: `critical`, `major`, `minor`
- for each finding: evidence from this packet, impact, recommended fix
- verdict: `pass`, `pass_with_changes`, or `fail`
- not_assessed
- recommendation: implement now on stacked branch, wait for PR #29 merge, or
  revise spec/tasks first

Do not ask to read files. Treat this packet as the review input.
