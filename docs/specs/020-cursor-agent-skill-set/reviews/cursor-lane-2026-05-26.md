# Cursor Lane: 020 Cursor Agent Skill Set

Date: 2026-05-26

## Scope

Validate that Cursor Agent CLI can consume a Portolan context pack and answer
with evidence states. This lane does not prove full blind discovery of the
`.cursor` rule; it tests the assisted context-pack behavior required by the new
skill set.

## Commands

Portolan context pack:

```bash
go run ./cmd/portolan context prepare --root internal/testfixtures/landscape-map --out /tmp/portolan-hypothesis-context --profile cursor --force
```

Cursor-assisted lane:

```bash
agent -p --mode=ask --trust --workspace /home/fall_out_bug/projects/sdp/portolan '<prompt with /tmp/portolan-hypothesis-context>'
```

## Result

- Cursor read and used the context pack path supplied in the prompt.
- Cursor preserved `unknown` and `not_assessed` surfaces in the answer.
- Cursor reported the Portolan-discovered 0-repository gap for the fixture.
- The lane is not a blind rule-discovery pass because the prompt explicitly
  named the context pack.

## Classification

| Check | Classification | Evidence |
| --- | --- | --- |
| Cursor can consume a generated context pack. | `verified` | `/tmp/portolan-cursor-plus.out` |
| Cursor can discover the workflow from only the rule/skill. | `not_assessed` | no blind rule-discovery lane run |
| Cursor preserves evidence gaps when prompted with the pack. | `verified` | assisted lane summary |

