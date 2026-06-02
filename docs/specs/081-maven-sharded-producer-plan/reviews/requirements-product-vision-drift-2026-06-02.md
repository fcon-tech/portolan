# Requirements And Product-Vision Drift Review

Date: 2026-06-02

Spec: `docs/specs/081-maven-sharded-producer-plan/`

## Requirements Drift

verified:

- The original Bigtop stress report names Java/Scala/Maven inter-repo
  relationship evidence as `not_assessed`.
- Spec 078 improved the next-action surface but intentionally emitted a
  family-level Maven plan.
- Cursor Composer 2.5 stress on the fresh spec 078 context classified the
  Maven next action as `partial` because it exposed one sample `pom.xml`, not a
  multi-repo rollout plan.
- Spec 081 narrows the correction to Maven/CycloneDX command planning only.

not_assessed:

- Actual Maven producer execution.
- Dependency graph evidence.
- JVM inter-repo relationship evidence.

## Product-Vision Drift

verified:

- The slice preserves Portolan as a local-first context preparation and
  evidence-routing tool.
- The slice composes CycloneDX Maven output instead of adding a Portolan-owned
  JVM parser or adapter.
- The generated commands remain approval-gated and non-counting evidence until
  the operator supplies local output.

risks:

- A long command list can become noisy in very large landscapes. The
  implementation caps generated commands and records the cap in the plan
  reason.

## Disposition

No blocking drift found. Proceed with focused implementation and stress.
