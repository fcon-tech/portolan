# Requirements And Product-Vision Drift Review

Date: 2026-06-02

Spec: `docs/specs/083-tool-acquisition-guidance/`

## Inputs

- Integrated Cursor Composer 2.5 stress for PR #57-#60.
- User correction: Portolan must be stack-agnostic, but should help pull in the
  right tools.
- Portolan product boundary in `AGENTS.md`.
- Constitution local-first, evidence-state, and OSS-composition principles.

## Drift Assessment

Requirements:

- Aligned. The slice improves the navigation surface for missing evidence
  families without adding a stack-specific scanner or adapter.

Product boundary:

- Aligned. Portolan remains a read-only local discovery substrate and
  normalizer for local producer evidence.
- The slice explicitly rejects defaulting to PHP/JVM/Gradle adapters.
- Tool candidates remain options for local acquisition, not observed evidence.

Evidence semantics:

- Aligned. Candidate tools, install suggestions, and approval-gated commands
  remain `not_assessed` until local output exists and is re-ingested.

Open-source posture:

- Aligned. Mature OSS/native producer tools stay outside Portolan ownership;
  Portolan documents how to acquire and normalize their outputs safely.

Decision:

- Proceed with a focused context guidance correction.
- Do not create a Gradle-specific implementation slice.
