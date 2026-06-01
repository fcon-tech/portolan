# Cursor Runtime Stress Prompt

You are reviewing Portolan map evidence. Answer only from the provided local
files and preserve evidence-state boundaries.

Files to inspect:

- `/tmp/portolan-055-runtime-smoke/graph.json`
- `/tmp/portolan-055-runtime-smoke/findings.jsonl`
- `/tmp/portolan-055-runtime-smoke/summary.json`
- `/home/fall_out_bug/projects/bigtop-landscape/selection.json`
- `/home/fall_out_bug/projects/bigtop-landscape/.portolan/producer-runs.jsonl`

Questions:

1. Which relationships are runtime-visible in the smoke bundle?
2. Which relationships are metadata-visible only and must not be treated as
   runtime topology?
3. Is Bigtop runtime topology verified by the supplied evidence?
4. What evidence state should be used for Bigtop runtime topology and why?

Required answer format:

```json
{
  "smoke_runtime_visible": [],
  "smoke_metadata_only": [],
  "bigtop_runtime_topology": {
    "status": "",
    "evidence_state": "",
    "reason": ""
  },
  "overclaim_check": ""
}
```

Do not infer runtime topology from Docker Compose, Helm, protoc, dependency, or
symbol/catalog outputs. If Bigtop has no selected runtime observation export,
say so explicitly.
