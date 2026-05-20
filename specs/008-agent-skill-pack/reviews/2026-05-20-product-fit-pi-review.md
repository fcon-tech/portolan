# Product-Fit Pi Review: Agent Skill Pack

**Date**: 2026-05-20
**PR**: #8
**Head**: `10a313da1042bf3fc673a82287548d81fda24b93`
**Mode**: REVIEW

## Review Target

Reviewed whether PR #8 matches the intended product task:

- Portolan is a local-first evidence graph/toolbox for agents, not Cursor-only
  and not another coding harness.
- Cursor + Composer is only the first cheap acceptance client.
- The guide must separate current reality from target contract.
- Missing `doctor`, `map`, `run.json`, `findings.jsonl`, and detector coverage
  must be gaps, not implied implemented features.
- The report must cover relationships, duplication, configuration surfaces,
  technical debt, unknown/cannot_verify, and a backlog-ready gap ledger.
- The generic skill must not hard-code Bigtop smoke choreography or a brittle
  per-repo decision tree.

## Review Lanes

| Lane | Status | Verdict | Summary |
| --- | --- | --- | --- |
| `openrouter/~google/gemini-pro-latest` | verified | APPROVED | No major findings; no required fixes. |
| `openrouter/~anthropic/claude-opus-latest` | verified | APPROVED | No blockers; minor follow-up risks only. |

## Gemini Findings

| Severity | Finding | Disposition |
| --- | --- | --- |
| major | None. | no action |
| minor | `agent/AGENT_GUIDE.md` and `.cursor/rules/portolan-map.mdc` ask agents to try unavailable `portolan doctor` and `portolan map`, which may create command-not-found context noise. | accepted as non-blocking: this is intentional gap discovery and is bounded by the fallback path. |

Gemini explicitly approved the linear workflow, exclusion of Bigtop-specific
choreography from the generic guide, and example report scale.

## Opus Findings

| Severity | Finding | Disposition |
| --- | --- | --- |
| major | None. | no action |
| minor | `agent/AGENT_GUIDE.md` uses `/tmp/portolan-run`; this is fine on macOS/Linux but not Windows-portable. | follow-up only: current acceptance client is Cursor on the local Unix-like environment; add a generic temp-dir note when portability becomes a real acceptance target. |
| minor | `agent/examples/map-report.md` has concrete-looking synthetic evidence refs such as `graph.json#/edges/12`; an agent could copy them literally. | follow-up candidate: add an illustrative-only note if the Bigtop smoke shows copying risk. |
| minor | `.cursor/rules/portolan-map.mdc` says to try target commands while the guide says not to depend on them. | accepted as watch item: the rule remains a thin wrapper and points back to the guide. |
| minor | Review disposition files reference model lanes by configured `pi` ids; this is harmless but should not be treated as external public model naming. | no product fix required. |
| minor | README does not mirror the full current-command list from `docs/agent-toolbox/README.md`. | follow-up only: not needed for this PR because the portable guide and toolbox doc contain the contract. |

Opus explicitly approved the current-vs-target split, short guardrails instead
of a decision tree, no Bigtop choreography in the generic guide, the 12-column
gap ledger, thin Cursor wrapper, and the report category set.

## Final Disposition

| Surface | Status |
| --- | --- |
| Product-task fit | verified |
| Current reality vs target contract | verified |
| Gap ledger availability | verified |
| Product-category report shape | verified |
| Generic guide avoids Bigtop-specific choreography | verified |
| Generic guide avoids brittle decision tree | verified |
| Required fixes from this review | none |
| GitHub checks | not_assessed: no checks reported on PR branch |
| Human/GitHub approval | not_assessed |

## Verdict

PR #8 remains fit for the next step: immediate Bigtop acceptance smoke using the
skill pack. Do not expand the generic skill before that smoke unless a concrete
agent failure produces a new gap.
