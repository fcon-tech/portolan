# Tool Profile: ast-index (Claude-ast-index-search)

| Field | Value |
| --- | --- |
| Role | `producer_candidate` (symbol/reference v1.1) |
| User job | Symbol/reference search via local index |
| License | Review upstream before adoption |
| Review date | 2026-06-10 |
| Portolan action | Import bounded JSON when spec 085 is planned; watcher/hooks blocked by default |

## Risks

| Risk | Boundary |
| --- | --- |
| SQLite/cache in target | Mutation risk — approval required |
| Watcher/hooks/MCP | Blocked by default |
| Reference completeness | `not_assessed` unless output proves coverage |

## Approval gate

Spec 085 implementation gate; see draft spec 085.
