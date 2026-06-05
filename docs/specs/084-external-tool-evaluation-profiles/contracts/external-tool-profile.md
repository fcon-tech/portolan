# Contract: External Tool Evaluation Profile

External tool profiles are committed planning artifacts, not graph evidence.
Their product-facing role labels are companion guidance only; they do not
replace existing machine-readable producer-family `Decision` or `SupportState`
records.

## Required Sections

- Project identity.
- Last refreshed date.
- Role classification.
- Observed license and maintenance snapshot.
- Useful output surfaces.
- Local execution posture.
- Target mutation, network/install, daemon/watch, and privacy risks.
- Approval boundary.
- Recommended Portolan action.
- Evidence limitations.

## Evidence Rules

- A profile may recommend a local producer candidate.
- A profile must not create graph facts.
- A profile must not create a parallel machine-readable producer decision
  scheme; future importer specs must map profile decisions to the existing
  producer-family record contract.
- Role mapping must follow
  `docs/adapter-contracts/external-tool-evaluation-profiles.md` and
  `schema/producer-family.schema.json`.
- A profile must not promote symbol/reference/call/runtime evidence to
  `source-visible`, `metadata-visible`, or `runtime-visible`.
- A profile must preserve stale upstream metadata as stale until refreshed.

## Safety Rules

- Network download, tool install, target mutation, hook install, MCP install,
  watcher startup, daemon startup, and global configuration writes require
  explicit human or spec-level approval.
- LLM-authored summaries and dashboards are not evidence unless a future spec
  proves deterministic, locally supplied, evidence-bounded output.
