# Producer Acceptance Ledger: 2026-05-26

## Target And Commands

- Target: `/home/fall_out_bug/projects/bigtop-landscape`
- Context output: `/tmp/portolan-035-bigtop-context`
- Context command: `go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-035-bigtop-context --profile cursor --force`
- Syntax check: `jq empty /tmp/portolan-035-bigtop-context/oss-plan.json`

## Producer Results

| Producer | Family | Status | Reason |
| --- | --- | --- | --- |
| `syft` 1.44.0 | `cyclonedx` | `verified` | Produced CycloneDX 1.6 JSON at `/tmp/portolan-035-bigtop-context/tool-outputs/syft.cyclonedx.json`; summary shows 18,769 components and 5,357 dependency records. |
| `jscpd` 4.2.4 | `jscpd` | `failed` | Installed and started, but the default full Bigtop invocation produced unbounded clone stdout and was interrupted before `jscpd-report.json` was written. |
| `semgrep` 1.157.0 | `semgrep` | `not_assessed` | Installed, but no local Semgrep config was found; network-backed configs are outside the default safety boundary. |

## Portolan Contract Finding

- `failed`: before the implementation fix, `context prepare --force` deleted
  context-local `tool-outputs/`, so the advertised producer `after_run` command
  erased freshly generated Syft output.
- `verified`: after the fix, `context prepare --force` preserves existing
  context-local tool outputs, detects `syft.cyclonedx.json`, records it in
  `tool-registry.json`, and marks the CycloneDX `oss-plan` entry as
  `input_present`.

## Evidence Impact

| Question Family | Before OSS Output | After OSS Output | Impact |
| --- | --- | --- | --- |
| SBOM/component identity | `not_assessed` without CycloneDX/Syft output | CycloneDX/Syft output observed with 18,769 components and 5,357 dependency records | `changed` |
| Near-clone duplication | `not_assessed` beyond native exact duplicate findings | no jscpd JSON output generated | `failed` |
| Semantic config/IaC findings | `not_assessed` without local Semgrep output | no local Semgrep config | `not_assessed` |

## Product Claim Decision

- OSS producer execution on the fixed Bigtop target: `partially_verified`.
- OSS composition value from real generated producer outputs: `accepted` for
  Syft/CycloneDX component identity evidence only.
- Near-clone duplication through jscpd: `not_verified` because the unbounded
  default invocation did not complete.
- Semgrep-backed semantic config/IaC findings: `not_assessed`.

## Remaining Gap

The next useful follow-up is a separately approved bounded jscpd profile for the
large Bigtop target, likely excluding generated/vendor-heavy paths or limiting
the scope by repository. That is a product decision because it changes the
producer execution contract and evidence coverage.
