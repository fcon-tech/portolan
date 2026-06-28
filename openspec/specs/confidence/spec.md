# Confidence Specification

## Purpose

Defines the mandatory trust contract: every assertion carries a confidence
level bound to its producer family. Confidence is orthogonal to evidence source
and is the product's spine, not a feature.

Source authority: `docs/captain-atlas/08-portolan-product-charter.md` § Trust
Contract (migrated).

## Requirements

### Requirement: Every assertion carries confidence
Every assertion-bearing object in the snapshot SHALL carry a confidence level.
This MUST be one of: `ironclad`, `hypothesis-with-facts`, `hypothesis`,
`speculation`. This is mandatory and not optional.

#### Scenario: Assertion without confidence is invalid
- GIVEN an assertion-bearing object in the snapshot
- WHEN it is validated
- THEN it has a confidence field set to one of the four levels

### Requirement: Confidence is bound to producer family by contract
The confidence level SHALL be bound to the producer family by contract, not
self-declared arbitrarily. A deterministic producer MAY emit only `ironclad`.
An agent producer MAY emit any of the other three.

#### Scenario: Deterministic producer emits only ironclad
- GIVEN a deterministic producer emits an assertion
- WHEN its confidence is set
- THEN it is `ironclad`

#### Scenario: Agent producer cannot emit ironclad
- GIVEN an agent producer emits an assertion
- WHEN its confidence is set
- THEN it is one of hypothesis-with-facts, hypothesis, or speculation

### Requirement: hypothesis-with-facts requires resolvable evidence
An agent producer SHALL emit `hypothesis-with-facts` only when its assertion
carries a resolvable evidence pointer (`evidence.source` non-empty and
resolvable to an artifact in the snapshot). An agent asserting
`hypothesis-with-facts` with an empty or unresolvable source SHALL be a
validation failure and MUST be downgraded to `hypothesis`.

#### Scenario: Unresolvable source downgrades
- GIVEN an agent asserts hypothesis-with-facts with an empty evidence.source
- WHEN validation runs
- THEN the assertion is downgraded to hypothesis

### Requirement: Deterministic core is authoritative on conflicts
The deterministic producer's assertion SHALL be authoritative when it conflicts
with an agent producer's assertion about the same object, and the agent's
assertion SHALL be recorded as a finding at `hypothesis` confidence.

#### Scenario: Core overrides agent on the same fact
- GIVEN the core and an agent assert about a unit's type
- WHEN the snapshot merges them
- THEN the core's type is authoritative
- AND the agent's claim is recorded as a hypothesis-level finding

### Requirement: Agent-vs-agent conflict — higher confidence wins
The higher-confidence agent claim SHALL win when two agent producers assert
about the same fact, and the disagreement SHALL be recorded as a finding.
Conservative MUST mean disagreements are never silently dropped, NOT that the
least-evidenced claim wins.

#### Scenario: Better-evidenced agent claim wins
- GIVEN agent A asserts speculation and agent B asserts hypothesis-with-facts about the same fact
- WHEN the snapshot merges them
- THEN B's claim wins
- AND a finding records A's speculation claim

### Requirement: Confidence is orthogonal to evidence.state
Confidence (trustworthiness of an assertion) SHALL be orthogonal to
`evidence.state` (the source of an observation). Both MUST be present. An
`ironclad` assertion MUST carry `evidence.state` in {`source-visible`,
`metadata-visible`, `runtime-visible`}.

#### Scenario: Ironclad requires source-visible evidence state
- GIVEN an assertion has confidence ironclad
- WHEN it is validated
- THEN its evidence.state is source-visible, metadata-visible, or runtime-visible

### Requirement: Compatibility matrix enforced at 0.2.0
The 0.2.0 schema validator SHALL enforce the confidence/evidence-state
compatibility matrix. Until the 0.2.0 migration ships, the confidence contract
is aspirational and the frozen 0.1.0 contract stands.

#### Scenario: claim-only disallows ironclad
- GIVEN an assertion has evidence.state claim-only
- WHEN it is validated at 0.2.0
- THEN its confidence is not ironclad
