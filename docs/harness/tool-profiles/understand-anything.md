# Tool Profile: Understand-Anything

| Field | Value |
| --- | --- |
| Role | `ux_pattern_source` |
| User job | Interactive map UX (explore, search, tours) |
| License | MIT |
| Review date | 2026-06-10 |
| Portolan action | Historical: viewer-pattern source for the removed `viewer/` app; **reject** LLM graph as evidence |

## Output surface

- Upstream: interactive graph + Q&A (not Portolan evidence)
- Portolan (historical): bundle consumed by the former `viewer/`; today the `portolan-core` reading layer

## Risks

| Risk | Boundary |
| --- | --- |
| LLM-authored nodes | UX-only; never `source-visible` |
| Network / model calls | Stripped in the atlas path |
| Confusion with truth | Atlas badges show `producer_ref` |

## Approval gate

Full UA fork optional; no upstream submodule. The in-repo viewer was removed 2026-06-28; its patterns informed the portolan-core shell.

## Spike

[`docs/research/2026-06-10-understand-anything-fork-spike.md`](../../research/2026-06-10-understand-anything-fork-spike.md)
