# Product Hypothesis Ledger: Native Configuration Gap Fix

Date: 2026-05-26

## Hypothesis

Cursor-plus-Portolan becomes more useful for CTO-level repository questions
when `portolan map` exposes configuration surface inventory before the agent
starts reading files manually.

## Change

- Spec `012-configuration-surfaces` now implements native file-based
  configuration surface detection.
- `portolan map --root` emits observed `configuration` findings and graph nodes
  for env var names, ports, container/workflow/manifests, feature flags, and
  secret references.
- Secret values are not recorded in findings, graph labels, summaries, or map
  output.
- Semantic IaC/config correctness remains OSS/Semgrep-backed and must stay
  `not_assessed` when no local output exists.

## Evidence

- verified: `go test -count=1 ./internal/configuration ./internal/app -run 'TestDetect|TestRunMapDetectsConfigurationSurfacesWithoutSecretValues|TestRunMapUnsupportedDetectorFindingsRemainNotAssessed'`
- verified: `go run ./cmd/portolan map --root testdata/configuration-surfaces/repo --out /tmp/portolan-012-config --force`
- verified: JSONL parse over `/tmp/portolan-012-config/findings.jsonl`
- verified: secret-leak check over `/tmp/portolan-012-config` for
  `super-secret`, `postgres://`, and `password-value`

## Updated Gap State

| Gap | Before | After |
| --- | --- | --- |
| `GAP-DUP-CFG-DEBT` | native configuration detector absent | file-based config surface inventory partially addressed |
| secret handling | unverified for native config | values intentionally omitted and checked by fixture smoke |
| semantic IaC/config validation | `not_assessed` without local tool output | still `not_assessed` without Semgrep/config scanner evidence |

## Product Interpretation

This improves the Cursor augmentation story for arbitrary source checkouts by
making implicit config surfaces visible early. Cursor should answer:

- env vars, ports, manifests, workflows, feature flags, secret references: from
  `findings.jsonl` when observed;
- secret values: not collected by Portolan;
- semantic misconfiguration or policy compliance: from local OSS scanner output
  when present;
- otherwise: `not_assessed`.
