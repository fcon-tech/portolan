# Contract: Agent Guide And Cursor Rule

## Portable Guide Path

```text
agent/AGENT_GUIDE.md
```

The guide must include:

- trigger phrases;
- current-command fallback for immediate Bigtop smoke;
- target `portolan map` command once spec 009 is implemented;
- target artifact list;
- evidence states;
- report format;
- stop conditions.

## Cursor Rule Path

```text
.cursor/rules/portolan-map.mdc
```

The rule must:

- apply when the user asks to map, audit, inspect, or understand a codebase;
- point to `agent/AGENT_GUIDE.md`;
- instruct the agent to run Portolan before manual architecture claims;
- tell the agent to report from artifacts only.

## Example Output Path

```text
agent/examples/map-report.md
```

The example must show relationships, duplication, configuration, technical debt,
unknown, and cannot-verify sections with evidence state and source columns.
