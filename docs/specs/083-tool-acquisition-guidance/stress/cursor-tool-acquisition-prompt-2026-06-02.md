# Cursor Composer 2.5 Stress Prompt: Tool Acquisition Guidance

Evaluate Portolan as a stack-agnostic local-first navigation harness after a
tool acquisition guidance correction.

Allowed context only:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-083-tool-acquisition-guidance/context`

Forbidden reads/actions:

- do not read sibling `.portolan/stress/*` roots
- do not read root `run/` or map bundles outside this context
- do not read `/home/fall_out_bug/projects/bigtop-landscape/repos` source files
- do not run Syft, Maven, Gradle, jscpd, Docker, or any producer
- do not install tools or mutate the target

Task:

Judge whether Portolan stays stack-agnostic while still helping an agent pull
in the right local producer tools. Verify that candidate tools are not treated
as Portolan-owned PHP/JVM/Gradle adapters and that all producer evidence remains
`not_assessed` until local output exists.

Required output fields:

- lane_state
- artifacts_read_count
- forbidden_read
- acquisition_guidance_present
- acquisition_tool_count
- stack_specific_adapter_requested
- candidate_tools_as_evidence
- installed_tools_claimed_as_supported_evidence
- approval_boundary_present
- risks_named
- evidence_until_output
- producer_outputs_present
- component_dependency_claimable
- runtime_topology_claimable
- next_actions_specific_enough
- residual_gaps
- verdict
