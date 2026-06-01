# Post-Merge Guidance Review Disposition

Date: 2026-06-01

Review lane:
`docs/specs/053-language-agnostic-producers/reviews/post-merge-guidance-review-kimi-2026-06-01.md`

## Disposition

| Finding | Lane severity | Disposition | Evidence |
| --- | --- | --- | --- |
| Verify no other `renderAgentBrief` callers were missed. | critical | rejected after local verification | `rg -n "renderAgentBrief\\(" internal` found only the updated call site and the updated function definition. |
| Prose substring tests are brittle. | major | rejected for this slice | Existing app tests already assert generated guidance wording. This branch intentionally hardens specific agent-facing contract phrases that caused stress drift. |
| `Local producer evaluation records: 0` could be read as assessed support instead of absent local evaluation input. | major | accepted and fixed | `agent-brief.md` now prints `Local producer evaluation records: <n> (not_assessed until local evaluation input exists)`. |
| `Observed CycloneDX/Syft components` conflates format family and producer. | major | accepted and fixed | The generated brief now says `Observed CycloneDX components`; the actual tool-registry record still carries the local producer path and summary. |
| Equal SBOM metric tie-breaking is arbitrary. | minor | rejected | The brief only reports the largest observed CycloneDX component/dependency counts for navigation scale. Equal-count tie identity is not used as evidence. |
| Query warning string is long. | minor | rejected | The warning is JSON output for agents, not a narrow terminal UI. Splitting into structured warning objects is a follow-up if query UX changes. |
| Query warning test should assert exactly one warning or full text. | minor | rejected | The test asserts the semantic boundary. Requiring exactly one warning would make future additive warnings noisy without improving evidence honesty. |
| Remove `currently` from native map relationship extraction wording. | minor | accepted and fixed | `answer-contract.md` now says native map relationship extraction is limited to Go imports and go.mod manifests. |

## Follow-Up

The review did not change the remaining product follow-up from the stress run:

- post-map navigation for SBOM-scale high-degree graph hubs;
- clearer grouping for large `unknown` node buckets;
- optional bounded relationship-candidate index.

Those require a separate navigation slice, not another wording patch inside
the producer-family correction.
