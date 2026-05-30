# Portolan Answer Contract

Target root: `<bigtop-root>`

Use this contract before answering CTO-level questions about a large or
multi-repo codebase. Portolan augments the coding agent; it does not replace
the agent, Cursor, source reading, or human judgment.

## Mandatory Answer Shape

Every broad answer must include:

- Answer: the shortest useful conclusion supported by local evidence.
- Evidence: artifact paths and record IDs from Portolan or local OSS outputs.
- Unknowns: explicit `unknown`, `cannot_verify`, or `not_assessed` surfaces.
- Next local command: the smallest read-only command that would reduce the most
  important unknown.

Do not answer from vibes, naming conventions, or repository size alone. If an
evidence family is missing, say `not_assessed` and point to `oss-plan.json` or
the needed map command.
