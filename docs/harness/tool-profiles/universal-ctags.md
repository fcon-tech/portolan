# Tool Profile: Universal Ctags

| Field | Value |
| --- | --- |
| Role | `producer_candidate` (v1.1) |
| User job | Symbol definitions for navigation (not full call graph) |
| License | GPL-2.0 (ctags binary) |
| Review date | 2026-06-10 |
| Portolan action | Import JSON symbol output; optional `graph-slice.json` nodes |

## Output surface

- `ctags --output-format=json --fields=+nKz -R`

## Risks

| Risk | Boundary |
| --- | --- |
| Definition-only | References/call graph remain `not_assessed` |
| Scale | Bounded target list; budget in recipe |
| GPL | Document distribution boundary if bundling binary |

## Approval gate

Operator approves ctags install and file scope.

## Recipe

[`harness/recipes/symbols-ctags.md`](../../../harness/recipes/symbols-ctags.md)
