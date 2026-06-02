# Bigtop Context Smoke

Spec: `docs/specs/080-clean-start-artifact-guard/`

Date: 2026-06-02

## Command

```bash
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context \
  --profile cursor \
  --force
```

## Evidence

verified:

- Context pack was written to:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context`.
- `agent-brief.md` contains `Fresh Artifact Boundary` and names the current
  context output path.
- `answer-contract.md` contains `Fresh Artifact Boundary`, the current context
  output path, and the contaminated/non-counting evidence rule.
- `query-plan.md` instructs agents to confirm the current context boundary and
  ignore stale sibling `.portolan/stress/*` outputs.
- JSON validation passed for `repos.json`, `tool-registry.json`,
  `oss-plan.json`, and `gaps.jsonl`.
- `repos.json` reports 18 discovered repositories.
- `oss-plan.json` reports 5 OSS/native producer plan entries.
- `agent-brief.md` reports `Local producer run records: 5 (0 verified current
  records; 5 not_assessed; Portolan did not execute them)`.
- `evidence-index.jsonl` keeps prior producer-run metadata visible as
  `not_assessed`, but scrubbed the stale sibling stress `path`, `output_path`,
  and `command` fields.
- Exact stale producer output strings from
  `20260601-054-initial-proof/tool-outputs` are absent from the generated
  context pack.
- Top-level `/home/fall_out_bug/projects/bigtop-landscape/run` is absent.
- No `context/tool-outputs` directory was created, so no native OSS producer was
  executed by this smoke.

not_assessed:

- Prior `.portolan/stress/*` roots were not deleted; they remain historical
  evidence and are forbidden by generated guidance unless explicitly named.

## Commands Used To Inspect

```bash
rg -n "Fresh Artifact Boundary|Current context output|Ignore sibling|contaminated|current context boundary|stale sibling" \
  /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context
jq empty \
  /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/repos.json \
  /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/tool-registry.json \
  /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/oss-plan.json \
  /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/gaps.jsonl
rg -n '20260601-054-initial-proof|path.*20260601-054|output_path.*20260601-054|command.*20260601-054' \
  /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context
rg -n 'Local producer run records' \
  /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/agent-brief.md
```
