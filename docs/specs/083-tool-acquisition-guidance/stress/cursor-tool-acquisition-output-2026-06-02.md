# Portolan 083 Stress Evaluation: Tool Acquisition Guidance

Assessment from allowed context only:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-083-tool-acquisition-guidance/context
```

No forbidden paths were read and no producers were run.

| Field | Value |
| --- | --- |
| `lane_state` | `completed` |
| `artifacts_read_count` | 8 |
| `forbidden_read` | false |
| `acquisition_guidance_present` | true |
| `acquisition_tool_count` | 5 |
| `stack_specific_adapter_requested` | false |
| `candidate_tools_as_evidence` | false |
| `installed_tools_claimed_as_supported_evidence` | false |
| `approval_boundary_present` | true |
| `risks_named` | true |
| `evidence_until_output` | `not_assessed` |
| `producer_outputs_present` | partial |
| `component_dependency_claimable` | false |
| `runtime_topology_claimable` | false |
| `next_actions_specific_enough` | true for Syft, jscpd, and Maven; partial for Gradle/Semgrep |
| `verdict` | pass |

Cursor verdict:

> Portolan behaves as a stack-agnostic local-first navigation harness: it routes
> agents to approval-gated native producers without posing them as
> Portolan-owned language adapters, and keeps producer/candidate evidence
> `not_assessed` until local output is produced and re-ingested.

## Key Evidence

- `oss-plan.json` includes `acquisition` guidance on all 5 tool plans.
- Candidate tools are local producer options, not PHP/JVM/Scala/Gradle
  adapters.
- `producer-recommendation` records remain `candidate_only` /
  `not_assessed`.
- Installed Syft, jscpd, and Maven availability does not become evidence:
  `evidence_state` and `evidence_until_output` remain `not_assessed`.
- Approval, network, mutation, and output-not-evidence-until-reingested risks
  are named.
- Component/dependency and runtime-topology claims remain blocked.

## Residual Gaps

- Empty `tool-registry.json`.
- No map bundle in context.
- Native map remains limited to Go.
- Gradle/Semgrep have no bounded command in this isolated branch.
- This branch is based on `origin/main` and does not include pending clean-start
  guard PR #58, so older verified producer-run records can still appear as
  metadata-visible prior proof paths. That is not a 083 regression, but the
  integrated PR #57-#60 scratch stress already showed the clean-start guard
  scrubs sibling stress outputs when #58 is included.
- External completeness remains `unknown`.
