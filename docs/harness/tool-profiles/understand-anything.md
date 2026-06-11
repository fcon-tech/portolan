# Tool Profile: Understand-Anything

| Field | Value |
| --- | --- |
| Role | `ux_pattern_source` |
| User job | Interactive map UX (explore, search, tours) |
| License | MIT |
| Review date | 2026-06-10 |
| Portolan action | Fork/borrow viewer patterns in `viewer/`; **reject** LLM graph as evidence |

## Output surface

- Upstream: interactive graph + Q&A (not Portolan evidence)
- Portolan: Portolan bundle consumed by `viewer/`

## Risks

| Risk | Boundary |
| --- | --- |
| LLM-authored nodes | UX-only; never `source-visible` |
| Network / model calls | Stripped in Portolan viewer path |
| Confusion with truth | Viewer badges show `producer_ref` |

## Approval gate

Full UA fork optional; MVP viewer ships in-repo without upstream submodule.

## Spike

[`docs/research/2026-06-10-understand-anything-fork-spike.md`](../../research/2026-06-10-understand-anything-fork-spike.md)
