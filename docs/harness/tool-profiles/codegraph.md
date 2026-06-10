# Tool Profile: CodeGraph

| Field | Value |
| --- | --- |
| Role | `producer_candidate` (lower fit) |
| User job | Call graph / impact exploration |
| License | Review upstream before adoption |
| Review date | 2026-06-10 |
| Portolan action | Profile only until separate import spec; default workflow writes `.codegraph/` in target |

## Risks

| Risk | Boundary |
| --- | --- |
| Target mutation | `.codegraph/` in repo — approval required |
| Watch/MCP/daemon | Blocked by default |
| Evidence semantics | No Portolan evidence states in native output |

## Approval gate

Explicit spec required before import planning (per FR-008 spec 084).
