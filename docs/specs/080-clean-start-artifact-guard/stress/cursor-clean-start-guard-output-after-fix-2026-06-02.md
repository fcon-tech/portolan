# Cursor Clean-Start Guard Stress

## Lane State

status: verified

## Current Boundary

The active lane is bounded to:

**Target root:** `/home/fall_out_bug/projects/bigtop-landscape`

**Current Portolan evidence:** `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context`

Per `agent-brief.md`, `answer-contract.md`, and `query-plan.md`, only this context directory and output paths declared inside it count as current evidence. Sibling `.portolan/stress/*` roots, root-level `run/`, and unrelated `reports/` outputs are stale or forbidden unless the user, dated lane ledger, or prompt explicitly allow them.

This evaluation lane additionally mirrors that rule: the user prompt names the same fresh context path and forbids other stress siblings, `run/`, and generated Portolan artifacts outside the fresh context.

**Local scope discovered (metadata only):** 18 repositories under `repos/`, all `source-visible`, discovered via `repos child repository` (`repos.json`).

**Coverage in this context pack:**
- Local tool-output candidates: **0** (`tool-registry.json` is empty)
- Build/deploy relationship candidate summaries: **30**
- Gap records: **11**
- Producer-run records: **5** (all `not_assessed` in `evidence-index.jsonl`)
- OSS recipes available but not run: **3** (Syft, jscpd, Maven CycloneDX sample)

## Artifacts Read

Exact paths read (all inside the allowed fresh context directory):

1. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/agent-brief.md`
2. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/answer-contract.md`
3. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/query-plan.md`
4. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/repos.json`
5. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/gaps.jsonl`
6. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/tool-registry.json`
7. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/oss-plan.json`
8. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/evidence-index.jsonl` (partial reads plus targeted grep within this file)

No files under `repos/` were opened directly. Repo paths appear only as metadata inside the context artifacts above.

## Forbidden Path Check

**no**

No sibling stress directories, `run/`, map bundles, `producer-runs.jsonl`, or other forbidden inputs were read.

## Supported Claim

From allowed inputs only, Portolan can support the following about **clean-start artifact hygiene**:

1. **Explicit boundary contract exists.** The fresh context pack documents a “Fresh Artifact Boundary” in three places (`agent-brief.md`, `answer-contract.md`, `query-plan.md`) that treats sibling `.portolan/stress/*`, root-level `run/`, and unrelated reports as stale/forbidden unless explicitly re-allowed.

2. **This lane starts from a clean, self-contained context pack.** Generated at `2026-06-02T10:48:21Z`, scoped to stress root `20260602-080-clean-start-artifact-guard`. `tool-registry.json` lists **zero** ingested OSS/tool outputs, so the agent is not steered by pre-existing tool artifacts inside this context.

3. **Stale producer outputs are actively guarded, not silently reused.** Three `producer-run` records (`producer-run-alluxio-grpc-descriptor-20260601`, `producer-run-alluxio-helm-monitor-20260601`, `producer-run-bigtop-compose-20260601`) report that source metadata was validated from `.portolan/producer-runs.jsonl`, but because outputs live under a **sibling** `.portolan/stress` run outside the current boundary, **path and command fields were scrubbed** and the records remain **`not_assessed`** to prevent stale artifact reuse.

4. **Future OSS output is path-bounded to the current context.** `oss-plan.json` declares:
   - `output_path` and `tool_output_dir` under the current context only
   - Rule: native OSS commands must write only under the context output directory
   - Syft excludes `./.portolan/**` and `./run/**`
   - jscpd ignores `**/.portolan/**` among other generated/build dirs

5. **What the agent may claim from this pack is intentionally thin.** With no tool outputs and all producer families gap-marked, Portolan steers the agent toward boundary-safe reading order and preserves `unknown` / `not_assessed` rather than inferring architecture from stale or out-of-scope artifacts.

**Bottom line:** Portolan, as represented by this stress context, implements clean-start hygiene as **policy + metadata scrubbing + empty tool registry + bounded future output paths**, not as proof that the filesystem is free of stale artifacts or that an agent will obey the boundary at runtime.

## Unknowns

**`cannot_verify`**
- Whether sibling stress artifacts or root-level `run/` actually exist on disk
- Whether an agent would honor the boundary under real use (this lane only read the contract)
- Whether scrubbing fully prevents contamination if an agent ignores instructions and opens forbidden paths

**`not_assessed`**
- All 11 OSS/tool families in `gaps.jsonl` (asyncapi, backstage, cyclonedx, jscpd, openapi, runtime-observation, semgrep, structurizr, symbol-index, etc.)
- All 5 `producer-run` records for usable evidence in this lane (3 scrubbed due to sibling outputs; 2 missing runtime/symbol-index exports)
- All 72 producer-coverage records and 6 producer-recommendation records
- Semantic parsing of the 30 build/deploy relationship candidates (filename-based discovery only)
- Map-bundle artifacts (`summary.json`, `graph-index.json`, `coverage.json`, `findings.jsonl`, `map.md`) — not present in this context-only lane
- JVM/PHP/Scala dependency and service-topology claims
- Runtime topology, duplication, static findings, API/catalog completeness

**`unknown`**
- External ecosystem completeness (`gap-external-completeness`)
- Whether the landscape includes repositories beyond the 18 discovered under `repos/`

**Internal context inconsistency (observed, not resolved):** `agent-brief.md` summarizes producer runs as “5 (`verified` records describe externally generated outputs)”, while `evidence-index.jsonl` marks all five as `status: not_assessed`. The scrubbed records explain validation of source metadata without promoting outputs into current evidence — but the brief’s “verified” wording vs index status is ambiguous without reading forbidden `producer-runs.jsonl`.
