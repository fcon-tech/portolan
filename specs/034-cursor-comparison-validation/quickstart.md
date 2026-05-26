# Quickstart: Cursor Comparison Validation

Run from the Portolan repository root.

## 1. Verify Local Preconditions

```bash
test -d /home/fall_out_bug/projects/bigtop-landscape
go run ./cmd/portolan --help
go run ./cmd/portolan context prepare --help
go run ./cmd/portolan map --help
go run ./cmd/portolan graph slice --help
```

If the Bigtop target is absent or unreadable, record the comparison as
`blocked` rather than selecting another target.

## 2. Prepare Portolan Artifacts

```bash
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /tmp/portolan-034-bigtop-context \
  --profile cursor \
  --force

go run ./cmd/portolan map \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /tmp/portolan-034-bigtop-map \
  --force
```

The assisted lane starts from:

- `/tmp/portolan-034-bigtop-context/`
- `/tmp/portolan-034-bigtop-map/summary.json`
- `/tmp/portolan-034-bigtop-map/graph-index.json`
- targeted graph slices only when needed

The assisted lane must not load full `graph.json` as the first-pass input.

## 3. Run Both Lanes

Use the same five CTO questions for both lanes:

1. What is the local scope and what completeness is unknown?
2. What duplicate or component risk can be safely claimed?
3. What implicit knowledge appears in local evidence, and what is only a
   claim?
4. What service relationships can be safely stated?
5. What are the most useful next local actions?

Lane rules:

- Cursor-alone may inspect `/home/fall_out_bug/projects/bigtop-landscape` but
  receives no Portolan-generated artifacts.
- Cursor-plus-Portolan receives the context pack and bounded map artifacts
  above.
- Both lanes must run without network access, target mutation, or credentials.

## 4. Score The Outputs

For each of the five questions and each lane, record:

- unsupported claim count;
- scope correctness;
- evidence use;
- unknown handling;
- next action quality;
- scoring notes.

Keep prompts, raw outputs, artifact paths or checksums, and all `unknown`,
`not_assessed`, `failed`, or `blocked` surfaces in the review ledger.

## 5. Classify The Product Claim

Apply the configured decision rule:

- `accepted`: unsupported claims drop by at least 50% and useful next actions
  are equal or better on at least 75% of questions.
- `narrowed`: exactly one threshold passes.
- `rejected`: neither threshold passes after both lanes complete.
- `blocked`: either lane cannot run.
- `inconclusive`: outputs exist but cannot be scored reliably.

Store the final ledger under:

```text
specs/034-cursor-comparison-validation/reviews/
```
