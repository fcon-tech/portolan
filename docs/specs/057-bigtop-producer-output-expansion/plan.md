# Implementation Plan: Bigtop Producer Output Expansion

**Branch**: `codex/057-bigtop-producer-output-expansion` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

## Summary

Generate additional safe local producer outputs for Bigtop beyond Syft and
CycloneDX, record producer-run evidence, and stress Cursor against the expanded
evidence. Prioritize outputs available now without mutation: expanded Alluxio
protobuf descriptors, additional Alluxio Helm templates, jscpd duplication
reports, and semgrep output or an explicit telemetry-safe blocker. Preserve
runtime and symbol/reference gaps unless real outputs are acquired.

## Technical Context

**Available tools verified locally**:

- `protoc` `libprotoc 35.0`
- `helm` `v3.19.4`
- `jscpd` `4.2.4`
- `semgrep` `1.164.0`
- `gopls`, `javap`, `mvn`

**Candidate local inputs**:

- 27 Alluxio proto files under
  `/home/fall_out_bug/projects/bigtop-landscape/repos/alluxio/core/transport/src/main/proto`
- 5 Alluxio Helm charts under
  `/home/fall_out_bug/projects/bigtop-landscape/repos/alluxio/integration/kubernetes`
- Bigtop and selected component source trees for jscpd/semgrep bounded scans.

## Decision Gate

- Simpler/Faster: run existing local producers and record outputs instead of
  implementing scanners.
- Blocking Edge Cases: large outputs can be noisy; semgrep findings are
  static analysis metadata, not validated vulnerabilities; duplication output
  is code similarity, not architecture by itself; runtime still requires
  runtime-visible observations.
- Existing Open Source: use `protoc`, `helm`, `jscpd`, and `semgrep` because
  they are mature local tools already installed.

## Verification

Run:

```bash
go test -count=1 ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

Also run focused producer commands and Cursor stress. Record all evidence under
`docs/specs/057-bigtop-producer-output-expansion/reviews/` and external stress
outputs under `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/`.
