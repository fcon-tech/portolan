# Quickstart: Agent Skill Pack

## Install In A Repository

Copy or vendor these files into a repository that should be mapped:

```text
agent/AGENT_GUIDE.md
agent/examples/map-report.md
.cursor/rules/portolan-map.mdc
```

## Cursor Acceptance Prompt

```text
Read the Portolan agent guide in this repository.
map this shit
```

## Expected Agent Behavior

The agent should:

1. read `agent/AGENT_GUIDE.md`;
2. run `portolan doctor`;
3. run current Portolan commands, or `portolan map --root . --out .portolan/run`
   once available;
4. inspect `.portolan/run/run.json`, `.portolan/run/graph.json`,
   `.portolan/run/findings.jsonl`, and `.portolan/run/map.md`;
5. answer with evidence-backed sections;
6. stop if Portolan is missing or artifacts cannot be verified.

## Expected Non-Behavior

The agent should not:

- start with random manual architecture exploration;
- fetch upstream resources without explicit approval;
- infer facts outside Portolan artifacts;
- hide `unknown`, `cannot_verify`, or `not_assessed` states.
