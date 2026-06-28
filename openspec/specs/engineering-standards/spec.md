# Engineering Standards Specification

## Purpose

Locks in the portolan-core engineering approach: Clean Architecture, the
dependency rule, SOLID, and TDD. These are enforced conventions, not aspirations
— each requirement is backed by an automated check that runs in CI.

Source authority: migrated from established portolan-core practice
(`scripts/check-dependency-rule.js`, the BDD runner, the Clean Architecture
layering).

## Requirements

### Requirement: Clean Architecture layering
portolan-core SHALL be organised in Clean Architecture layers — `domain`,
`use-cases`, `ports`, `adapters` — where dependencies point strictly inward.
The domain layer SHALL be pure: it MUST NOT import use-cases, ports, or
adapters.

#### Scenario: Domain imports only domain
- GIVEN the portolan-core source tree
- WHEN the dependency-rule checker scans domain/*
- THEN every relative import resolves within domain/
- AND the checker reports zero violations

### Requirement: Dependency rule enforced in CI
The dependency rule SHALL be enforced by `portolan-core/scripts/check-dependency-rule.js` and this check MUST run in CI. The rule: adapters → use-cases → domain; ports reference domain types only; use-cases never import adapters; domain imports only domain. A build with an inward-forbidden import SHALL fail.

#### Scenario: Inward-forbidden import fails the build
- GIVEN a domain module imports an adapter
- WHEN the dependency-rule checker runs
- THEN it exits non-zero with a VIOLATION report

#### Scenario: Clean tree passes
- GIVEN the current portolan-core source
- WHEN the dependency-rule checker runs
- THEN it reports "dependency-rule: OK (0 violations)"

### Requirement: Ports are interface-only
The `ports` layer SHALL define interfaces (contracts) only. Ports MAY reference
domain types but MUST NOT contain implementation that depends on adapters or
external infrastructure.

#### Scenario: Port has no adapter dependency
- GIVEN a port module
- WHEN its imports are inspected
- THEN it imports only domain or ports, never adapters

### Requirement: SOLID — single responsibility per module
Each module SHALL have one responsibility: domain modules hold pure business
rules; use-case modules orchestrate one interaction; adapters implement one
port against one mechanism. A module that mixes layers or responsibilities
SHOULD be split.

#### Scenario: Use-case orchestrates one interaction
- GIVEN a use-case module
- WHEN its surface is inspected
- THEN it depends on domain + ports only and orchestrates a single interaction

### Requirement: Test-driven development
Every OpenSpec scenario that has an executable counterpart SHALL be bound to a
real, passing unit test. The BDD runner
(`portolan-core/test/bdd-runner.js`) SHALL verify each feature is anchored to an
OpenSpec living spec, to a feature file, and to a unit test. New behavior MUST
land with its scenario binding.

#### Scenario: BDD runner verifies the full binding chain
- GIVEN the portolan-core test suite
- WHEN the BDD runner executes
- THEN every binding has a feature, a unit test file that exists on disk, a
  feature file that exists on disk, and an OpenSpec spec that exists on disk

### Requirement: Dependency inversion for outward concerns
Outward concerns (filesystem, rendering, navigation) SHALL cross the boundary
through ports, not direct imports. Adapters SHALL implement ports; use-cases
SHALL depend on ports, never on concrete adapters.

#### Scenario: Use-case depends on a port, not an adapter
- GIVEN a use-case that needs the filesystem
- WHEN it is implemented
- THEN it depends on the atlas-store / nav-source port
- AND an adapter provides the concrete filesystem implementation
