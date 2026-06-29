# Spec Delta — atlas-identity

## ADDED Requirements

### Requirement: Expedition context packs are the agent-facing delivery shape
The agent-atlas SHALL deliver compact expedition context packs: bounded,
query-relevant bundles scoped to a specific investigation. A pack SHALL fit an
agent context budget by default; a full landscape SHALL be opt-in and MUST NOT
be the default agent surface.

#### Scenario: A pack is scoped to a question
- GIVEN an agent begins an investigation with a specific question
- WHEN it requests a context pack
- THEN the pack contains only the units, edges, surfaces, findings, and anchors
      relevant to that question
- AND the pack fits a bounded context budget by default

#### Scenario: Full landscape is opt-in
- GIVEN an agent wants the whole landscape
- WHEN it explicitly requests the full graph
- THEN it is delivered as an opt-in response, not the default
