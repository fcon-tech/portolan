# Pre-Implementation Review Disposition: Agent Bootstrap Discovery

Date: 2026-05-21

## Scope Reviewed

- `README.md`
- `agent/AGENT_GUIDE.md`
- `docs/agent-toolbox/README.md`
- `.cursor/rules/portolan-map.mdc`
- `agent/examples/map-report.md`
- `specs/014-agent-bootstrap-discovery/spec.md`
- `specs/014-agent-bootstrap-discovery/plan.md`
- `specs/014-agent-bootstrap-discovery/tasks.md`

## Decision Gate

- Simpler/Faster: Implement the slice as root navigation, portable Markdown
  instructions, a portable skill wrapper, and stale-doc cleanup. No CLI change
  is needed unless verification shows the existing `map` command cannot support
  the documented workflow.
- Blocking Edge Cases: Agents may start from only the repository root, may lack
  a globally installed binary, may be operating inside the target rather than
  the Portolan checkout, may only inspect files, or may encounter non-source
  targets and stale `.portolan/run` artifacts.
- Existing Open Source: This is an agent instruction packaging problem, not a
  scanner or protocol problem. Existing skill/rule conventions are sufficient;
  adding an MCP/LSP surface or external documentation generator would add
  moving parts without improving the current UX.

## Findings

### major: No stable root-discoverable bootstrap file

`README.md` links `agent/AGENT_GUIDE.md`, but the spec requires a short stable
entrypoint that an agent can discover from root navigation without being told an
internal guide path. Add `agent/START_HERE.md` and link it from the root README
as the agent-facing entrypoint.

Disposition: accepted; fix in this slice.

### major: Cursor wrapper references a non-existent command

`.cursor/rules/portolan-map.mdc` tells agents to try `portolan doctor`, while
`agent/AGENT_GUIDE.md` states that `portolan doctor` is not implemented. This
creates a false first step and violates the current-command contract.

Disposition: accepted; fix in this slice.

### major: Portable skill artifact is missing

The existing guide is portable prose, but there is no skill import artifact
under `agent/skills/portolan-map/`. Harnesses that support reusable skills
cannot import a stable skill surface.

Disposition: accepted; fix in this slice.

### major: Example report is stale for the current `map` command

`agent/examples/map-report.md` still describes `portolan map` as unavailable
and uses lower-level `scan`/`packet` artifacts as the main path. Since
`portolan map` is implemented, this conflicts with the bootstrap contract.

Disposition: accepted; fix in this slice.

### minor: Non-source targets are implied, not explicit enough

The current guide protects local-first behavior, but it does not clearly tell
agents that build, packaging, configuration, and test-instruction repositories
are valid targets and must not trigger implicit upstream source cloning.

Disposition: accepted; fix in this slice.

## Review Evidence State

- verified: local file inspection of the reviewed documents.
- not_assessed: external model review lanes before implementation.
- not_assessed: blind agent trial; reserved for spec 015.
