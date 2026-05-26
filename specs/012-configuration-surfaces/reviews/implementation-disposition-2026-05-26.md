# Review Disposition: Configuration Surface Detection

Date: 2026-05-26

## Scope

- Spec: `specs/012-configuration-surfaces/`
- Implementation: native file-based configuration surface detection in
  `portolan map`, graph nodes, JSONL findings, agent guidance, backlog status,
  and product hypothesis ledger update.
- Explicit non-scope: semantic IaC/config validation, cloud API inspection,
  live infrastructure queries, policy compliance, and external scanner
  execution. Those remain OSS/Semgrep or config-scanner-backed and
  `not_assessed` when no local output exists.

## Decision Gate

- Simpler/Faster: implement bounded lexical detection for local files. Do not
  add YAML/TOML parsers, cloud SDKs, policy engines, or external scanner
  execution in this slice.
- Blocking Edge Cases: semantic IaC analysis, Helm templating, generated files,
  lockfiles, binary content, large files, and secret payloads can produce noisy
  or unsafe results. Native detection records surface names and paths only.
- Existing Open Source: Semgrep and IaC/config scanners remain the mature OSS
  options for semantic checks. Portolan keeps those in the OSS/tool-output path.

## Review Lanes

- `kimi-coding/kimi-for-coding`: not_assessed. Lane produced no output and was
  terminated after hanging.
- `minimax/MiniMax-M2.7`: not_assessed. Provider returned `404 404 page not
  found`.
- `zai/glm-5.1`: not_assessed. Lane produced no output and was terminated
  after hanging.

## Local Review Findings

- accepted/fixed: `assertSchemaShape` did not include the new `configuration`
  graph node kind. The schema-shape test allowlist now includes both
  `duplication` and `configuration` nodes.
- accepted/fixed: binary `.env` candidates could create a file-role node before
  the binary-content check. Role nodes are now added only after the file is
  confirmed readable text.
- accepted/fixed: feature-flag detection was too broad and could treat
  `features` as a flag name. The pattern now requires an explicit feature/flag
  token with a suffix.
- accepted/fixed: secret detection could pick secret-like words from values.
  The detector now records secret references from key names and env var names,
  not from arbitrary value fragments.
- no open local findings after re-test.

## Verification

- verified: `go test -count=1 ./internal/configuration ./internal/app -run 'TestDetect|TestRunMapDetectsConfigurationSurfacesWithoutSecretValues|TestRunMapUnsupportedDetectorFindingsRemainNotAssessed'`
- verified: `go test -count=1 ./...`
- verified: `jq empty schema/*.json`
- verified: `git diff --check`
- verified: `go run ./cmd/portolan map --root testdata/configuration-surfaces/repo --out /tmp/portolan-012-config --force`
- verified: JSONL parse over `/tmp/portolan-012-config/findings.jsonl`
- verified: `/tmp/portolan-012-config/summary.json` reports eight
  configuration findings and eleven observed findings.
- verified: secret-leak check over `/tmp/portolan-012-config` for
  `super-secret`, `postgres://`, and `password-value`.
- verified: `scripts/bootstrap-portolan --help`

## Status

- Implementation: local implementation complete for file-based configuration
  surface inventory.
- Local verification: passed.
- Review evidence: local review passed after fixes; pi model lanes degraded as
  `not_assessed`.
- PR state: not_assessed.
- GitHub checks: not_assessed.
- Merge readiness: not_assessed.
- Stop reason: local slice ready to commit; PR/readiness/merge surfaces are out
  of scope for this local commit.
