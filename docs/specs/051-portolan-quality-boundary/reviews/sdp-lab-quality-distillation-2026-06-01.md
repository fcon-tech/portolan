# SDP Lab Quality Distillation

Date: 2026-06-01

Mode: DESIGN_REVIEW

## Source Inspected

Repository: `/home/fall_out_bug/projects/sdp/sdp_lab`

Useful sources:

- `docs/reference/trust-guarantees.md`
- `docs/reference/maturity-matrix.md`
- `docs/reference/harness-parity-matrix.md`
- `docs/reference/product-surface.md`
- `docs/reference/FALLBACK_MODE.md`
- `internal/scout/types.go`
- `internal/scout/format.go`

## What Transfers To Portolan

- Maintain canonical guarantees and non-guarantees.
- Classify surfaces by maturity and release role.
- Keep static adapter parity separate from runtime readiness.
- Use a stable machine contract plus readable rendering.
- Preserve fallback artifact quality.

## What Does Not Transfer

- SDP delivery operator mode.
- Beads and workstream gates.
- in-toto/Sigstore evidence machinery for the first quality-boundary slice.
- Full SDP manifest complexity.

## Applied Decision

Split the previous combined work into:

- `051-portolan-quality-boundary`: product quality, trust, maturity, and report
  correctness.
- `052-agent-scan-report-ux`: user experience for asking an agent to scan and
  return a report.
