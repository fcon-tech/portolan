# Cursor Composer 2.5 Stress Prompt: Syft Sharded SBOM Plan

Evaluate Portolan as a local-first navigation harness after a Syft/CycloneDX
sharded SBOM plan correction.

Allowed context only:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-082-syft-sharded-sbom-plan/context`

Forbidden reads/actions:

- do not read sibling `.portolan/stress/*` roots
- do not read root `run/` or map bundles outside this context
- do not read `/home/fall_out_bug/projects/bigtop-landscape/repos` source files
- do not run Syft, Maven, Gradle, jscpd, Docker, or any producer
- do not install tools or mutate the target

Task:

Judge whether the previous residual gap is corrected: Syft/CycloneDX next
action should no longer be a single full-root SBOM command, but a
repository-sharded approval-gated plan. Component/dependency evidence must
remain `not_assessed` until local producer output exists.
