# Implementation Plan: Bigtop Semgrep Local Producer

**Branch**: `codex/063-bigtop-semgrep-local-producer`

## Decision Gate

- **Simpler/Faster**: Reuse the Spec 057 Semgrep blocker. Rejected because the
  blocker did not attempt a local config fallback.
- **Blocking Edge Cases**: Full corpus Semgrep is slow/noisy and can time out.
  Registry configs can fetch rules and use telemetry. Findings are mention-level
  metadata, not semantic references.
- **Existing Open Source**: Use installed Semgrep 1.164.0 with a local generic
  rule pack. Do not build a Portolan scanner.

## Scope

In scope:

- Local Semgrep config.
- Bounded scan of Bigtop provisioner/deploy surfaces.
- External raw JSON and summaries.
- Cursor stress and independent review.

Out of scope:

- Semgrep registry configs.
- Autofix.
- Runtime capture.
- Full source corpus scan.
- Full def/ref or call graph claims.

## Producer Run

verified:

- Command family:
  `semgrep scan --config <local-rule-pack> --metrics off --disable-version-check --json --max-target-bytes 1000000`.
- Targets:
  - `apache-bigtop-repo/provisioner/docker`
  - `apache-bigtop-repo/bigtop-deploy/puppet`
- Exit code: `0`.
- Files scanned: `102`.
- Findings: `143`.
- Semgrep errors: `0`.

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
