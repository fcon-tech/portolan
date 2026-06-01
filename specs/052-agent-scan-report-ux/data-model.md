# Data Model: E2E Agent Scan Report

## Scan Request

Represents the user's instruction to scan the open repository or local
landscape.

- `target_root`: Absolute local path selected by the user or harness.
- `output_dir`: Explicit Portolan output directory.
- `profile`: Agent-facing profile name. Cursor may be the first example, but
  the entity is harness-independent.
- `requested_sections`: Optional section list; default is the full first report.
- `created_at`: Local timestamp.

## Scan Run

Records what Portolan actually executed.

- `commands`: Ordered local commands.
- `artifacts`: Context, map, query, report, and optional producer artifact paths.
- `statuses`: `verified`, `failed`, `blocked`, or `not_assessed` command states.
- `warnings`: Non-fatal issues.
- `blockers`: Issues that prevented report completion.

## Evidence Bundle

The lower-level evidence used by the report.

- `context_pack`: `agent-brief.md`, `answer-contract.md`, `query-plan.md`,
  `evidence-index.jsonl`, `repos.json`, `tool-registry.json`, `oss-plan.json`,
  and `gaps.jsonl`.
- `map_bundle`: `summary.json`, `graph-index.json`, `coverage.json`,
  `findings.jsonl`, `map.md`, and bounded slices or query outputs.
- `producer_outputs`: Optional local OSS/tool outputs.
- `weak_states`: Aggregated `unknown`, `cannot_verify`, and `not_assessed`
  surfaces.

## First Report

The user-facing artifact the agent can return in chat and save locally.

- `run_status`: What ran, what failed, and where artifacts are.
- `visible_scope`: Single-repo or multi-repo scope and completeness boundaries.
- `visible_stack`: Languages, manifests, package/config/workflow/API surfaces
  supported by local evidence.
- `relationships_and_architecture`: Relationship findings, diagram, and
  evidence limits.
- `duplication`: Exact/native duplication and optional near-clone/component
  evidence status.
- `configuration`: Env vars, ports, workflows, manifests, feature flags, and
  secret references without values.
- `technical_debt`: Evidence-backed maintainability or operational debt
  candidates.
- `unknowns_and_gaps`: Explicit unresolved evidence states.
- `next_actions`: Ranked local steps to reduce important unknowns.

## Report Summary

Machine-readable counterpart to the report.

- `sections`: Required section presence and status.
- `positive_claims`: Claims with evidence references.
- `weak_claims`: Unknown, cannot-verify, and not-assessed records.
- `next_actions`: Ranked action records with command, approval boundary, and
  reason.
- `unsupported_claims`: Must be empty for acceptance.

## Architecture Diagram

Diagram or diagram-ready model included in the report.

- `format`: For example, Mermaid.
- `nodes`: Repositories, packages, contracts, or major surfaces.
- `edges`: Source-visible, metadata-visible, runtime-visible, claim-only, or
  unknown relationships.
- `legend`: Evidence state labels.
- `limitations`: Missing relationship families or topology boundaries.

## Acceptance Lane

Repeatable target and validation recipe for the E2E story.

- `target_name`: Synthetic fixture or public target name.
- `target_shape`: Single repo, multi repo, black-box mix, or landscape.
- `prompt_or_request`: The user-facing scan request.
- `expected_report_sections`: Required report sections.
- `validation`: Commands/checks that prove the report is complete and bounded.
