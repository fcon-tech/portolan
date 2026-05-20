# Pre-Implementation Review: Agent Skill Pack

**Date**: 2026-05-20T15:54:41Z
**Spec**: `specs/008-agent-skill-pack/`
**Mode**: REVIEW

## Scope

Reviewed `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`,
`contracts/agent-guide-contract.md`, `quickstart.md`, `AGENTS.md`,
`.specify/memory/constitution.md`, and `docs/product-backlog.md`.

## Decision Gate

| Question | Decision |
| --- | --- |
| Simpler/Faster | Use plain Markdown guide, one example report, and a thin Cursor rule. No MCP, LSP, installer, extension, or package integration in this slice. |
| Blocking Edge Cases | The guide must not imply `portolan map` exists today. It must name the target command and provide current-command fallback steps for the immediate Bigtop smoke. |
| Existing Open Source | Existing agent rule/skill patterns are enough for this slice. A protocol server or IDE extension is premature until the command/artifact contract is validated. |

## Local Findings

No blocking implementation findings.

- The spec is docs/rules-only and has concrete artifacts, paths, checks, and
  stop conditions.
- The intended artifacts preserve the product boundary: local-first,
  read-only, no network, no daemon, no credentials.
- The Cursor rule must stay a wrapper over `agent/AGENT_GUIDE.md`; duplicating
  the workflow in `.cursor/rules/portolan-map.mdc` would violate the plan.
- The example report must keep unsupported areas visible as `unknown`,
  `cannot_verify`, or `not_assessed`, not as omissions.

## External Review Lanes

| Lane | Status | Disposition |
| --- | --- | --- |
| `kimi-coding/kimi-for-coding` | not_assessed | Returned a request for file contents instead of reviewing the supplied contract. |
| `minimax/MiniMax-M2.7` | not_assessed | Returned pseudo tool calls for files that do not exist yet and no actionable findings. |
| `zai/glm-5.1` | not_assessed | Returned only an intent to read files and no actionable findings. |

## Implementation Constraints

- Do not add dependencies.
- Do not add runtime behavior.
- Do not claim `portolan map` is implemented.
- Keep `cmd/portolan` untouched.
- Update docs and status surfaces after the artifacts exist.
