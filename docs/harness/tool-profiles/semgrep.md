# Tool Profile: Semgrep

| Field | Value |
| --- | --- |
| Role | `producer_candidate` (required v1) |
| User job | Static smells, security/config patterns ("where it hurts") |
| License | LGPL-2.1 (tool); use local rule packs only by default |
| Review date | 2026-06-10 |
| Portolan action | Import JSON findings into hotspots (`kind: static-finding`) |

## Output surface

- `semgrep scan --json --config <local-rules>`

## Risks

| Risk | Boundary |
| --- | --- |
| Registry rule fetch | Blocked by default; local config only (spec 063 pattern) |
| Telemetry | Disable per Semgrep docs when scanning private code |
| False positives | Preserve `metadata-visible`; agent must cite rule id |

## Approval gate

Operator approves Semgrep install and rule pack path.

## Recipe

[`harness/recipes/static-semgrep-local.md`](../../../harness/recipes/static-semgrep-local.md)
