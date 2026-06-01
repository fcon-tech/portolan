# Post-Merge Navigation Stress

Date: 2026-06-01

Branch under correction: `codex/post-merge-navigation-guidance`

Target: `/home/fall_out_bug/projects/bigtop-landscape`

## Purpose

Validate the merged PR #30 producer-family guidance on a fresh Bigtop stress
run, then apply only non-UX corrections needed for Portolan's navigation
harness role.

## Clean Runs

| Run ID | State | Notes |
| --- | --- | --- |
| `20260601-190628` | verified | Current merged `main` after PR #30. Cursor + Composer 2.5 reported a qualified pass for anti-adapter routing and identified guidance gaps around Go-only map relationships, absent producer evaluations, context-vs-map gaps, and SBOM/unknown-node scale. |
| `20260601-191803` | verified | Follow-up run after guidance corrections. Syft/CycloneDX was regenerated with `.portolan/**` and root `run/**` excluded; context was refreshed after Syft output; map and query artifacts were regenerated. |

Root `/home/fall_out_bug/projects/bigtop-landscape/run` was absent before and
after the corrected run.

## Verified Artifacts

Corrected run directory:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-191803/`

Key artifacts:

- `context/agent-brief.md`
- `context/answer-contract.md`
- `context/query-plan.md`
- `context/evidence-index.jsonl`
- `context/gaps.jsonl`
- `context/tool-registry.json`
- `map/summary.json`
- `map/graph-index.json`
- `map/findings.jsonl`
- `query-gaps.json`
- `query-relationships.json`
- `cursor-composer25-final-after-sbom-count-output.md`

Corrected run metrics:

- Repositories: 18
- Syft/CycloneDX components: 18,769
- Syft/CycloneDX dependency records: 5,357
- Graph nodes: 190,748
- Graph edges: 200,203
- Findings: 274
- Findings by status:
  - `observed`: 161
  - `not_assessed`: 106
  - `cannot_verify`: 6
  - `unknown`: 1
- Findings by evidence state:
  - `source-visible`: 156
  - `metadata-visible`: 5
  - `not_assessed`: 95
  - `unknown`: 12
  - `cannot_verify`: 6

## Cursor + Composer 2.5 Verdict

Final output:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-191803/cursor-composer25-final-after-sbom-count-output.md`

Assessment:

- `verified`: Portolan is a local-first navigation harness for this target, not
  an architecture oracle.
- `verified`: Syft/CycloneDX is treated as `metadata-visible` producer
  evidence, not native JVM/PHP/Scala semantics.
- `verified`: relationship candidates are `source-visible` navigation hints,
  not parsed topology.
- `verified`: producer-family recommendations route to language-agnostic
  families and external/local producers, not Portolan-owned per-language
  adapters.
- `verified`: absent `producer-evaluation` records remain `not_assessed`;
  Portolan does not synthesize evaluations from recommendations.
- `verified`: Go/go.mod-only native map relationship extraction and skipped
  map surfaces are explicit.
- `not_assessed`: live Cursor UI behavior outside headless Cursor Agent.

Contamination:

- Old run IDs were not present in the final Cursor output.
- `map/graph.json` was not loaded by Cursor.
- A search for forbidden target-root run paths found no root `run/` usage. The
  output's contamination declaration mentions excluded categories, which is not
  evidence that they were read.

## Accepted Corrections

Implemented in this branch:

- `agent-brief.md` now reports producer recommendation, coverage, and local
  producer evaluation record counts.
- `agent-brief.md`, `answer-contract.md`, and `query-plan.md` now explicitly
  state that missing `producer-evaluation` records are `not_assessed` and that
  Portolan does not synthesize evaluations from recommendations.
- `agent-brief.md` and `answer-contract.md` now make the Go imports/go.mod
  native relationship boundary explicit.
- `agent-brief.md` now tells agents to read map `summary.json.skipped_surfaces`
  before non-Go, service-topology, runtime, or lifecycle claims.
- `agent-brief.md` now calls out CycloneDX/Syft component and dependency counts
  when observed, plus the SBOM package fan-out boundary.
- `agent-brief.md` and `query gaps` warning now separate
  `context/gaps.jsonl`/`producer-*` acquisition gaps from weak map records.

## Rejected Corrections

- Auto-emitting `producer-evaluation` records for recommended candidates:
  rejected. That would make Portolan synthesize evaluation evidence and cross
  the local-first normalization boundary. Evaluation records remain supplied by
  local operator/external artifacts.

## Remaining Follow-Up

Still product-relevant but out of scope for this narrow correction:

- Improve post-map navigation for SBOM-scale graphs where a Syft node creates a
  high-degree package fan-out.
- Reduce the opacity of large `unknown` node buckets in `graph-index.json` with
  stronger provenance grouping or drill-down guidance.
- Consider a dedicated bounded index for relationship candidates so agents do
  not need to scan the full `evidence-index.jsonl` for common build/deploy
  hints.

These are navigation-harness improvements, not UX polish and not a reason to
add PHP/JVM/Scala adapters.
