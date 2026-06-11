# Understand-Anything Fork Spike

Date: 2026-06-10

## Question

Can Portolan adopt Understand-Anything (UA) UX via fork (not rewrite) while keeping
evidence-backed hotspots as the only truth source?

## Upstream snapshot

| Field | Value |
| --- | --- |
| Repository | https://github.com/Egonex-AI/Understand-Anything |
| License | MIT (fork/redistribute allowed with notice) |
| Positioning | Interactive knowledge graph; explore, search, ask |
| Portolan role | `ux_pattern_source` — viewer fork, not evidence producer |

## Architecture (high level)

UA builds an interactive graph for exploration. Much of the product value is the
**viewer UX** (tours, search, Q&A). Graph construction may involve LLM-assisted
summarization — **unacceptable as Portolan `source-visible` evidence**.

## Portolan adapter strategy

1. **Do not** ingest UA LLM graph output as evidence.
2. **Do** implement `viewer/` as a UA-inspired local viewer that loads only
   `manifest.json` + `hotspots.jsonl` + optional `graph-slice.json`.
3. **Future option**: submodule or vendor UA frontend after stripping LLM graph
   generation; replace data loader with `loadPortolanBundle()`.

## Repo layout decision

**Recommendation: `portolan/viewer/` subdir** (single repo for harness + viewer).

Rationale:

- Harness skill references one checkout path.
- Portolan bundle contract stays co-located with `harness/contracts/`.
- Sibling repo deferred until viewer needs independent release cadence.

## Effort estimate

| Approach | Effort | Risk |
| --- | --- | --- |
| MVP viewer in `viewer/` (current slice) | 3–5 days | Low; may lack UA polish |
| Full UA fork + strip LLM pipeline | 2–3 weeks | Medium; upstream churn |
| Embed UA as git submodule | 1 week integration + ongoing sync | Medium |

**Phase 4 ships MVP viewer**; full UA fork remains a follow-up if MVP UX is insufficient.

## Strip list (full UA fork)

- LLM graph generation and "recover defaults" paths.
- Network calls for model providers.
- Any node promoted to architecture truth without `producer_ref`.

## Keep / borrow

- Graph tour and search entrypoint patterns (spec 086).
- Layered views (duplication, static findings, deps).
- Click-to-source navigation.

## Verification

MVP done when `viewer/` opens a fixture Portolan bundle and shows ranked hotspots
with evidence badges without network access.
