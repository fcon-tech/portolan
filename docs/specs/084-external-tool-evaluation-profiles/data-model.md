# Data Model: External Tool Evaluation Profiles

## Tool Evaluation Profile

Fields:

- `project_identity`: canonical repository owner/name and URL.
- `last_refreshed`: date when public metadata was checked.
- `license`: observed SPDX license from the refresh snapshot.
- `role`: one of `producer_candidate`, `ux_pattern_source`,
  `ready_for_import_planning`, `blocked`, or `rejected`.
- `fit`: short product-fit rationale.
- `output_surfaces`: deterministic local outputs, indexes, graph files,
  dashboards, MCP surfaces, or LLM-authored summaries identified by review.
- `local_execution_posture`: whether use is read-only, writes caches, writes in
  target, installs tools, starts watchers, or starts daemon/MCP behavior.
- `risks`: target mutation, network/install, daemon/watch, privacy, schema
  stability, and evidence-state risks.
- `approval_boundary`: action that requires human or future-spec approval.
- `recommended_portolan_action`: current adoption decision and next step.
- `evidence_limitations`: what remains `not_assessed`, `unknown`, or
  `cannot_verify`.

Validation rules:

- Every profile must include `last_refreshed`.
- The profile `role` is product-facing guidance only. Machine-readable producer
  evidence must continue to use existing producer-family decision/support-state
  records until a future spec changes that contract.
- Every execution, install, watcher, daemon, hook, MCP, or target-mutation path
  must be approval-gated.
- Profiles must not state that candidate output is observed Portolan evidence
  until a local output/import path exists.

## Candidate Role

Allowed states:

- `producer_candidate`: may be a useful local producer after approval and output
  review.
- `ux_pattern_source`: useful design/reference input, not a verified evidence
  producer.
- `ready_for_import_planning`: deterministic output is promising enough for a
  future importer spec.
- `blocked`: current behavior blocks safe adoption without redesign or
  approval.
- `rejected`: incompatible with Portolan's evidence boundary.

## Approval Boundary

An approval boundary records the exact class of action that Portolan does not
take by default:

- network download or package installation;
- target repository mutation or cache write;
- global agent/editor configuration write;
- hook installation;
- watcher, daemon, server, or MCP startup;
- LLM-authored graph or summary use as evidence.
