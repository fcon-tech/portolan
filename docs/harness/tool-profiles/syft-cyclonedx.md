# Tool Profile: Syft / CycloneDX

| Field | Value |
| --- | --- |
| Role | `producer_candidate` (required v1) |
| User job | Dependency hubs, component identity, SBOM-level duplication hints |
| License | Apache-2.0 (Syft); CycloneDX spec is open standard |
| Review date | 2026-06-10 |
| Portolan action | Import CycloneDX JSON; emit `dep-hub` hotspots from high-degree components |

## Output surface

- `syft scan <dir> -o cyclonedx-json`

## Risks

| Risk | Boundary |
| --- | --- |
| SBOM fan-out ≠ service topology | Hotspots are component hubs, not runtime coupling |
| Large multi-repo scan | Repository-sharded Syft (spec 082) |
| Network | Syft may fetch metadata; document operator approval |

## Approval gate

Operator approves Syft install and scan roots.

## Recipe

[`harness/recipes/deps-syft-cyclonedx.md`](../../../harness/recipes/deps-syft-cyclonedx.md)
