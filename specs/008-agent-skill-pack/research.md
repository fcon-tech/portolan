# Research: Agent Skill Pack

## Portable Guide First

Decision: Build a portable agent guide first, with Cursor rules as a thin
wrapper.

Rationale: The user wants Portolan to work with Cursor, Claude, Codex,
OpenCode, pi, and future harnesses. A guide plus rules is cheaper than MCP and
does not bind the product to one client.

Alternatives considered: Cursor-only rules were rejected because they make the
acceptance client look like the product. MCP was deferred because tool schema
and server lifecycle are premature before the command/artifact contract proves
itself.

## Cursor As Cheap Acceptance Client

Decision: Add a Cursor project rule only to test the agent workflow cheaply.

Rationale: Cursor gives an agent terminal access and readable workspace
artifacts. That is enough to validate whether a model follows the Portolan
workflow without prompt-by-prompt handholding.

Alternatives considered: Building a dedicated Cursor extension or MCP server
was rejected for this slice because the same behavior can be tested with
versioned rules and local commands.

## Artifact-First Reporting

Decision: The guide must tell agents to report from `run.json`, `graph.json`,
`findings.jsonl`, and `map.md`.

Rationale: The agent should use Portolan as an evidence substrate and avoid
free-form repo-wide inference.

Alternatives considered: Letting agents manually explore first was rejected
because it recreates the problem Portolan is meant to solve.
