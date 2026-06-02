# Quickstart: Clean Start Artifact Guard

Generate a fresh context pack:

```bash
RUN_ID=20260602-080-clean-start-artifact-guard
OUT=/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/$RUN_ID/context
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out "$OUT" \
  --profile agent \
  --force
```

Inspect the generated guardrails:

```bash
rg -n "Fresh Artifact Boundary|current context|forbidden|contaminated|stale" "$OUT"
jq empty "$OUT"/repos.json "$OUT"/tool-registry.json "$OUT"/oss-plan.json "$OUT"/gaps.jsonl
```

Expected:

- `agent-brief.md` names the current context output path.
- `answer-contract.md` includes fresh artifact boundary rules.
- `query-plan.md` instructs the agent to confirm the current context boundary.
- Producer-run records that point to sibling `.portolan/stress/*` outputs are
  `not_assessed` and do not expose stale `path`, `output_path`, or `command`
  fields in the fresh `evidence-index.jsonl`.
- No old `.portolan/stress/*` artifacts are deleted or reused by default.
