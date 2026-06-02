# Bigtop Context Smoke And Cursor Stress

Date: 2026-06-02

Spec: `docs/specs/083-tool-acquisition-guidance/`

## Fresh Context Smoke

Command:

```bash
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-083-tool-acquisition-guidance/context \
  --profile cursor \
  --force
```

verified:

- Context pack was written under:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-083-tool-acquisition-guidance/context`
- `context/tool-outputs` is absent; no native producer was executed.
- JSON validation passed for `repos.json`, `tool-registry.json`,
  `oss-plan.json`, and `gaps.jsonl`.
- Selected tool acquisition states:
  - `cyclonedx`: installed / `not_assessed`
  - `jscpd`: installed / `not_assessed`
  - `maven-cyclonedx`: installed / `not_assessed`
  - `gradle-cyclonedx`: installed but requires local evaluation /
    `not_assessed`

not_assessed:

- Actual Syft, jscpd, Maven, Gradle, Semgrep, Docker, or producer execution.
- Actual producer output validity.
- Component inventory, dependency relationships, duplication metrics, and
  runtime topology.

## Cursor Composer 2.5 Stress

Command:

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust "$(cat docs/specs/083-tool-acquisition-guidance/stress/cursor-tool-acquisition-prompt-2026-06-02.md)"
```

verified:

- `forbidden_read: false`
- `artifacts_read_count: 8`
- `acquisition_guidance_present: true`
- `acquisition_tool_count: 5`
- `stack_specific_adapter_requested: false`
- `candidate_tools_as_evidence: false`
- `installed_tools_claimed_as_supported_evidence: false`
- `approval_boundary_present: true`
- `risks_named: true`
- `evidence_until_output: not_assessed`
- `component_dependency_claimable: false`
- `runtime_topology_claimable: false`
- `verdict: pass`

disposition:

- Accepted as a passing stress lane for the tool acquisition guidance
  correction.
- Residual clean-start producer-run handling is owned by pending PR #58 and was
  already verified in the integrated PR #57-#60 scratch stress.
