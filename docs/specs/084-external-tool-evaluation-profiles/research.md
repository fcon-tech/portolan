# Research: External Tool Evaluation Profiles

## Decision: Keep Profiles As Documentation And Context Guidance

Portolan will keep external tool evaluation profiles as dated markdown records
and bounded context-pack guidance. Candidate profiles do not become graph facts,
do not change evidence states, and do not introduce importer contracts.
The human-readable profile `role` field is a companion decision label, not a
replacement for existing machine-readable `producer-evaluation` records. Future
importer or navigation specs must map candidate decisions back to the existing
producer-family `Decision` and `SupportState` fields before generated context
or evidence records depend on them.

Rationale: The feature is about adoption decisions and risk boundaries, not
executing or normalizing new tools. A documentation-first implementation is the
smallest reversible step and matches the backlog-only spec.

Alternatives considered:

- Add a JSON schema and machine-readable profile registry. Rejected for this
  slice because no importer or CLI consumer needs a stable profile format yet.
- Reuse only the existing producer-family `Decision` and `SupportState` enums
  in markdown. Rejected for this slice because maintainers need product-facing
  labels such as `ux_pattern_source`; accepted only with an explicit mapping
  boundary so the labels do not become a parallel machine-readable scheme.
- Add native producer execution wrappers. Rejected because the constitution
  defaults to import/export composition and requires explicit approval before
  installs, network access, daemon behavior, or target mutation.
- Add graph nodes for candidate tools. Rejected because a candidate is not local
  evidence until a deterministic output is supplied and imported.

## Decision: Use Dated GitHub Metadata Snapshots, Not Live Claims

Profiles will include a `Last refreshed` date and a short metadata snapshot for
license and repository health. The snapshot is evidence for planning only and
must be refreshed before implementation depends on current upstream behavior.

Rationale: The reviewed projects are moving quickly. A profile that looks
current without a refresh date invites stale adoption claims.

Snapshot checked on 2026-06-05 with GitHub API:

| Project | License | Default Branch | Pushed At | Stars | Forks |
| --- | --- | --- | --- | ---: | ---: |
| `colbymchenry/codegraph` | MIT | `main` | 2026-06-05T04:54:11Z | 41920 | 2584 |
| `Lum1104/Understand-Anything` | MIT | `main` | 2026-06-04T05:46:14Z | 52578 | 4315 |
| `defendend/Claude-ast-index-search` | MIT | `main` | 2026-06-03T14:46:59Z | 415 | 32 |

Alternatives considered:

- Treat the 2026-06-04 external review snapshot as sufficient. Rejected because
  current license and maintenance facts are cheap to refresh and drift-prone.
- Query GitHub during Portolan context generation. Rejected because Portolan
  stays local-first and read-only by default; no network calls in product code.

## Decision: Classify Ast-Index Strongest, CodeGraph Lower-Fit, Understand-Anything UX-Only

`Claude-ast-index-search` will be classified as the strongest current
symbol/reference producer candidate because it exposes local CLI/index/search
surfaces. `codegraph` will be classified as a lower-fit optional producer
candidate because its default workflow includes target-local `.codegraph/`
writes and broader install/watch/MCP behavior. `Understand-Anything` will be
classified as UX pattern source only unless a future spec proves deterministic,
locally supplied, evidence-bounded output.

Rationale: Portolan can reuse deterministic local outputs, but it cannot treat
LLM-authored graph summaries, dashboards, or agent instructions as evidence.

Alternatives considered:

- Treat all three tools as producer candidates. Rejected because their default
  outputs and authorship models are materially different.
- Reject all three until importers exist. Rejected because maintainers still
  need an honest candidate ledger and next-action guidance.

## Decision: No New Dependency

This slice uses existing Go tests and markdown artifacts only.

Rationale: A dependency would add maintenance and license review without
improving the user-visible profile decision.

Alternatives considered:

- Use a metadata parser or scanner library. Rejected because no structured
  parsing is needed beyond committed markdown and existing context output.
