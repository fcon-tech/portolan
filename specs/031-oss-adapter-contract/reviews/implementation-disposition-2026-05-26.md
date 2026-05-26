# Implementation Disposition: OSS Adapter Contract

## Scope

Implemented a published OSS/tool-output adapter contract plus local validation
command and fixtures for the current OSS assembly path.

## Decision Gate

- Simpler/Faster: JSON contract plus `portolan adapter validate`; no plugin
  runtime, installer, daemon, or OSS execution engine.
- Blocking Edge Cases: adapters can add license, network, mutation, source
  snippet, and secret-value risks. The validator rejects unsafe defaults before
  agents can rely on an adapter.
- Existing Open Source: no dependency is needed. Validation uses Go stdlib JSON
  and project-local rules.

## Review Lanes

- Local reviewer: accepted. Checked CLI contract, privacy/network/mutation
  checks, fixture coverage, docs, and baseline verification.
- `kimi-coding/kimi-for-coding`: `not_assessed`. Lane returned an attempted
  tool-discovery plan instead of concrete findings.
- `minimax/MiniMax-M2.7`: `not_assessed`. Lane failed with `404 page not
  found`.
- `zai/glm-5.1`: `not_assessed`. Lane returned an intent to gather context
  instead of concrete findings.

## Verification

- `verified`: `go test -count=1 ./...`
- `verified`: `jq empty schema/*.json testdata/oss-adapter-contract/*.json`
- `verified`: `git diff --check`
- `verified`: `go run ./cmd/portolan adapter validate --in testdata/oss-adapter-contract/jscpd.json`
- `verified`: `go run ./cmd/portolan adapter validate --in testdata/oss-adapter-contract/syft-cyclonedx.json`
- `verified`: `go run ./cmd/portolan adapter validate --in testdata/oss-adapter-contract/semgrep.json`
- `verified`: unsafe network/mutating fixture rejected with explicit errors

## Remaining Risks

- Validation does not execute OSS tools.
- License approval is recorded but not adjudicated by Portolan.
- The contract is intentionally conservative; additional output families may
  need schema extensions later.
