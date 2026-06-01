# Agent Examples

## Prepare Context For A Single Repo

```bash
portolan context prepare --root /path/to/repo --out /tmp/portolan-context --profile agent
```

Then read:

```text
/tmp/portolan-context/agent-brief.md
/tmp/portolan-context/answer-contract.md
/tmp/portolan-context/evidence-index.jsonl
/tmp/portolan-context/gaps.jsonl
```

## Map A Local Repo

```bash
portolan map --root /path/to/repo --out /tmp/portolan-map
```

Start with:

```text
/tmp/portolan-map/summary.json
/tmp/portolan-map/graph-index.json
/tmp/portolan-map/findings.jsonl
/tmp/portolan-map/map.md
```

## Map A Multi-Repo Landscape

```bash
portolan map --root /path/to/landscape --out /tmp/portolan-landscape-map
```

Portolan will inspect the target root, direct child Git repositories, and
`repos/*` Git repositories. If a complete inventory is required, ask the user
for a local selection or manifest.

## Use A Curated Selection

```bash
portolan selection validate --selection /path/to/selection.json
portolan map --selection /path/to/selection.json --out /tmp/portolan-selection-map
```

Use this only when the selection file exists.

## Bounded Graph Drill-Down

Use graph slicing before loading a large `graph.json`:

```bash
portolan graph slice --bundle /tmp/portolan-map --repo <repo-id> --out /tmp/repo-slice.json
portolan graph slice --bundle /tmp/portolan-map --edge-kind depends-on --out /tmp/depends-on-slice.json
portolan graph slice --bundle /tmp/portolan-map --finding-kind duplication --out /tmp/duplication-slice.json
```

## Report Shape

```text
Run status:
- command:
- output directory:
- blockers:

What is visible:
- repositories:
- key artifacts:

Findings:
- relationships:
- duplication:
- configuration:
- technical debt:

Gaps:
- unknown:
- cannot_verify:
- not_assessed:
```

Use evidence states. Do not hide gaps.
