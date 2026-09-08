# expedition Specification

## Purpose

Defines how a Portolan expedition behaves end to end: the one-phrase launch
the Governor gives, the single approval it asks, the survey method the
skill teaches, the verify loop that keeps the Chart honest, and the Sailing
Directions that come back.

## MODIFIED Requirements

### Requirement: One approval guards network and installation
The expedition SHALL ask exactly one explicit approval per session,
covering network access and external tool installation, and SHALL ask it
before any network access or installation occurs. Running the target's
builds and tests SHALL require no further approval. The expedition SHALL
write only under `<target>/.portolan/` — except the Pointer block in
`<target>/AGENTS.md`, placed and refreshed as the pointer capability
mandates — and SHALL never request, perform, or propose mutation of the
target's source.

#### Scenario: One prompt, then work
- **WHEN** the first run begins
- **THEN** the Governor receives exactly one approval request covering
  network access and tool installation, and no further approval requests
  during the session

#### Scenario: Builds run unbothered
- **WHEN** the expedition needs to build or test the target to learn its
  behavior
- **THEN** it runs those builds and tests without asking the Governor
  again, and receipts them in the ship's log

#### Scenario: The perimeter holds
- **WHEN** the expedition completes
- **THEN** every file it created or modified is under
  `<target>/.portolan/` — except the Pointer block in
  `<target>/AGENTS.md`, whose placement the skill mandates — and the
  target's source other than that block is byte-identical to before
