# Portolan Artifacts: Cursor Comparison Validation

Date: 2026-05-26

## Context Pack

Command:

```bash
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /tmp/portolan-034-bigtop-context \
  --profile cursor \
  --force
```

Result: `verified`

Output:

```text
wrote context pack /tmp/portolan-034-bigtop-context
```

Artifacts:

| Artifact | Bytes |
| --- | ---: |
| `agent-brief.md` | 1410 |
| `answer-contract.md` | 5006 |
| `evidence-index.jsonl` | 9178 |
| `gaps.jsonl` | 1734 |
| `oss-plan.json` | 1921 |
| `query-plan.md` | 1589 |
| `repos.json` | 3951 |
| `tool-registry.json` | 180 |

Observed records:

- `repos.json` repositories: 18
- `gaps.jsonl` lines: 9
- `evidence-index.jsonl` lines: 27

## Map Bundle

Command:

```bash
go run ./cmd/portolan map \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /tmp/portolan-034-bigtop-map \
  --force
```

Result: `verified`

Output:

```text
wrote map bundle /tmp/portolan-034-bigtop-map
```

Artifacts:

| Artifact | Bytes |
| --- | ---: |
| `coverage.json` | 5899 |
| `findings.jsonl` | 1288351 |
| `graph-index.json` | 369213 |
| `graph.json` | 132999480 |
| `map.md` | 232520 |
| `run.json` | 10717 |
| `summary.json` | 17915 |

Observed summary:

- Graph nodes: 172243
- Graph edges: 148714
- Repository nodes: 18
- Findings total: 555
- Findings by kind: configuration 153, duplication 283, inventory 18,
  relationships 97, technical-debt 4
- Findings by status: observed 430, not_assessed 118, cannot_verify 6,
  unknown 1
- Findings by evidence state: source-visible 425, metadata-visible 5,
  not_assessed 93, cannot_verify 6, unknown 26

## Evidence State

- Context preparation: `verified`
- Map bundle generation: `verified`
- Full ecosystem completeness: `unknown`
- Runtime-visible topology without local runtime exports: `not_assessed`
