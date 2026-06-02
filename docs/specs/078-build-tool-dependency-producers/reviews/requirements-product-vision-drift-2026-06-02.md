# Requirements And Product-Vision Drift Review

Spec: `docs/specs/078-build-tool-dependency-producers/`

Date: 2026-06-02

## Requirements Drift

verified:

- The stress report at
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-163222/consolidated-report.md`
  names Java/Scala/Maven inter-repo relationship graph as `not_assessed`.
- Fresh context smoke at
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-078-gap-reconstruction/context/oss-plan.json`
  listed Syft, jscpd, and Semgrep plans but no Maven/Gradle build-tool
  dependency producer plan.
- The same fresh context exposed build-manifest relationship candidates across
  Bigtop repositories, so the missing Maven/Gradle next-action surface is real.

accepted:

- Add approval-gated native Maven/Gradle/CycloneDX producer recommendations.
- Keep evidence `not_assessed` until local output exists.
- Do not run build tools or add parser dependencies in this slice.

rejected:

- Implement a Portolan-owned JVM parser or adapter.
- Treat Syft alone as enough guidance for Maven/Gradle relationship evidence.
- Run spec 074 runtime or spec 076 parity stress as part of this slice.

## Product-Vision Drift

pass:

- Local-first/read-only default is preserved.
- Portolan remains an evidence router/normalizer over OSS outputs.
- The slice improves the navigation harness by making the next evidence action
  more concrete, not by inventing architecture claims.

not_assessed:

- Actual Maven/Gradle dependency output quality on Bigtop.
- Runtime topology.
- Full symbol/reference graph and call graph.
- Cursor Composer 2.5 parity after this change.

## Decision

Proceed with spec 078 as a small behavior slice.

confidence: high
