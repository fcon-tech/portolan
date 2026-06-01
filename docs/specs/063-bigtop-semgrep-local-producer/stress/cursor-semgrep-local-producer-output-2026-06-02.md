# Cursor Stress Output: Semgrep Local Producer

Date: 2026-06-02
Model: `composer-2.5`
Mode: `agent --print --mode ask --model composer-2.5 --trust`

## Result

verified:

- Cursor classified `producer-run-bigtop-semgrep-local-api-catalog-20260602` as
  verified for the bounded scope.
- Cursor preserved the evidence state as `metadata-visible`.
- Cursor noted the producer used a local rule pack, `--metrics off`,
  `--disable-version-check`, exit `0`, 102 scanned files, 143 findings, and 0
  Semgrep errors.

cannot_verify:

- Runtime topology.
- Full symbol/reference graph.
- Call graph.
- Full Bigtop corpus coverage.
- Enterprise code-intelligence parity.

Safe claim:

> Semgrep 1.164.0 with a local rule pack produced `metadata-visible`
> API/catalog mention evidence for Bigtop `provisioner/docker` and
> `bigtop-deploy/puppet` surfaces only.
