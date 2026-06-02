# Cursor Clean-Start Guard Stress

## Lane State

status: **verified**

## Current Boundary

The lane’s authoritative evidence is only:

`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context`

`agent-brief.md`, `answer-contract.md`, and `query-plan.md` define a **Fresh Artifact Boundary**: treat only this context directory and output paths declared inside it as current Portolan evidence. Target root is `/home/fall_out_bug/projects/bigtop-landscape` (landscape scope), profile **Cursor**.

Explicit exclusions (unless user, dated lane ledger, or prompt names them):

- sibling `.portolan/stress/*` roots  
- root-level `run/`  
- unrelated `reports/` outputs  
- in baseline/no-Portolan lanes: all of `.portolan/`, root `run/`, and generated Portolan artifacts outside the named context  

`repos/` paths appear only as **relationship-candidate** pointers inside `evidence-index.jsonl` (sample manifest paths per repo). They are candidate inspection targets, not parsed topology; this evaluation did not open those source files.

## Artifacts Read

Exact paths read (all under the fresh context directory):

1. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/agent-brief.md`
2. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/answer-contract.md`
3. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/query-plan.md`
4. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/gaps.jsonl`
5. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/evidence-index.jsonl`
6. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/repos.json`
7. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/tool-registry.json`
8. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/oss-plan.json`

## Forbidden Path Check

**no**

No sibling stress roots, `run/`, map bundles, `producer-runs.jsonl`, or `repos/` source files were opened. Path strings inside allowed context files (e.g. `source_artifact` pointing at `.portolan/producer-runs.jsonl` or `repos/.../pom.xml`) were used only as metadata cited by Portolan, not as direct reads.

## Supported Claim

From allowed inputs only, Portolan can support the following about **clean-start artifact hygiene** as a navigation harness:

1. **Boundary is first-class and repeated** — `agent-brief.md`, `answer-contract.md`, and `query-plan.md` all instruct agents to confirm the boundary before answering and to mark the lane **contaminated** if forbidden paths are read.

2. **Stale sibling stress and root `run/` are explicitly forbidden** — unless explicitly allowlisted by user, lane ledger, or prompt (this prompt allowlists only the named `20260602-080-clean-start-artifact-guard` context).

3. **Context pack is self-contained for this lane** — generated at `2026-06-02T10:59:05Z`; `tool-registry.json` has **0** local tool-output candidates; `oss-plan.json` routes native OSS writes under `context/tool-outputs` and tells Syft to exclude `./.portolan/**` and `./run/**`.

4. **Prior producer outputs are demoted, not promoted** — `agent-brief.md` reports 5 local producer-run records, **0 verified current**; three historical runs (protoc, helm, docker-compose) are `not_assessed` because outputs sit under a **sibling** `.portolan/stress` run outside this context; **path and command fields were scrubbed** to avoid stale artifact reuse (`evidence-index.jsonl` lines 90–92).

5. **Scope discovery without stale map reuse** — 18 repositories in `repos.json`; 30 build/deploy relationship-candidate summaries; 11 gaps in `gaps.jsonl`; external ecosystem completeness **`unknown`**.

6. **Harness behavior, not landscape verdict** — Portolan documents what is in-bounds, what was scrubbed/downgraded, and what remains `not_assessed`; it does **not** claim clean filesystem state, absence of stale files on disk, or verified producer output for this lane.

## Unknowns

| Surface | State |
|--------|--------|
| Whether sibling stress dirs or `run/` still exist on disk | **cannot_verify** (forbidden to inspect) |
| Contents of `.portolan/producer-runs.jsonl` | **not_assessed** (referenced as upstream source only; outside fresh context) |
| Scrubbed producer-run output files | **not_assessed** (paths deliberately removed from context) |
| Map bundle (`summary.json`, `graph.json`, etc.) | **not_assessed** (no map in this context pack) |
| OSS families (asyncapi, backstage, cyclonedx, jscpd, openapi, semgrep, structurizr, symbol-index, runtime-observation) | **not_assessed** per `gaps.jsonl` |
| External ecosystem completeness | **unknown** |
| Semantic parsing of build/deploy manifests | **not_assessed** (relationship-candidates are source-visible pointers only) |
| Runtime topology, service relationships, duplication, dependency graphs | **not_assessed** without approved OSS/map/producer evidence |
| Whether an agent following Portolan will stay uncontaminated | **cannot_verify** (policy is documented; compliance is operational) |
| `repos/` file contents | **not_assessed** here (only path metadata in context; no direct source reads in this lane) |
