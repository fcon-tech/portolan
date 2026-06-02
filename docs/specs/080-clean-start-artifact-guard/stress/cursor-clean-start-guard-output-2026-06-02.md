# Cursor Clean-Start Guard Stress

## Lane State

status: **verified**

This lane read only the eight allowed files under the fresh context directory. No forbidden sibling stress roots, `run/`, map bundles, or `repos/` source trees were opened.

## Current Boundary

**Target root:** `/home/fall_out_bug/projects/bigtop-landscape`

**Authoritative Portolan evidence for this lane:**  
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context`

**Policy (from the pack):** Treat only this context directory and output paths declared inside it as current Portolan evidence. Sibling `.portolan/stress/*` roots, root-level `run/`, and unrelated `reports/` outputs are stale or forbidden unless the user, dated lane ledger, or prompt explicitly allows them. In a no-Portolan/baseline lane, `.portolan/`, root-level `run/`, and generated Portolan artifacts are forbidden; reading them contaminates the lane.

**This evaluation’s extra constraint (prompt):** Same as above, plus no reads outside that fresh context except `repos/` paths only if the context explicitly points there (it does via `repos.json` paths and relationship-candidate records, but those were not opened for this answer).

**Generated context metadata:** `schema_version` `0.1.0`, `generated_at` `2026-06-02T10:24:00.022136953Z`, profile `agent`.

## Artifacts Read

Exact paths (8 files only):

1. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/agent-brief.md`
2. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/answer-contract.md`
3. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/query-plan.md`
4. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/repos.json`
5. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/oss-plan.json`
6. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/tool-registry.json`
7. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/gaps.jsonl`
8. `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context/evidence-index.jsonl`

No `context/tool-outputs/` subtree exists in this fresh pack (only the eight files above).

## Forbidden Path Check

**no**

No reads were performed under sibling stress roots (e.g. `20260601-054-initial-proof`), `/home/fall_out_bug/projects/bigtop-landscape/run`, root-level `.portolan/producer-runs.jsonl`, or map bundles outside the fresh context.

## Supported Claim

Based only on allowed inputs, Portolan can claim the following about **clean-start artifact hygiene** as a navigation harness:

**1. The pack explicitly defines and enforces a fresh-artifact boundary in prose.**  
`agent-brief.md`, `answer-contract.md`, and `query-plan.md` all state that sibling `.portolan/stress/*` roots and root-level `run/` are stale/forbidden unless explicitly re-allowed, and that violating that boundary contaminates the lane.

**2. This lane’s context is self-contained as a context-only slice.**  
- `tool-registry.json`: `tools: []` — **0** local OSS/tool-output candidates in this fresh context.  
- `agent-brief.md`: 18 repos discovered; 0 observed OSS summaries; 11 gap records; no map bundle referenced in this pack.  
- Planned native outputs are scoped to  
  `.../20260602-080-clean-start-artifact-guard/context/tool-outputs`  
  (`oss-plan.json`).

**3. Future OSS acquisition is designed to avoid polluting stale roots.**  
`oss-plan.json` rules require writes only under the context output directory. Syft’s planned command excludes `./.portolan/**` and `./run/**`; jscpd’s planned ignore list includes `**/.portolan/**`. That is a **declared** hygiene policy for new producer output, not proof those commands were run.

**4. The fresh context does not itself ship new verified tool outputs.**  
All OSS families in `gaps.jsonl` are `not_assessed` except `external-completeness` (`unknown`). CycloneDX, jscpd, Semgrep, etc. have no local candidate output in this slice.

**5. Clean-start hygiene is partially undermined inside the same pack’s evidence index.**  
`evidence-index.jsonl` still indexes **five** `producer-run` records sourced from  
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/producer-runs.jsonl`, with **three** `verified` / `metadata-visible` runs whose `path` and `output_path` point at a **sibling** stress root:

- `.../.portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-grpc.descriptor.pb`
- `.../alluxio-monitor.helm-template.yaml`
- `.../apache-bigtop-compose.config.json`

Per the pack’s own boundary rules, an agent following clean-start discipline must **not** treat those paths as current evidence even though Portolan’s index still lists them as `verified`. The harness therefore teaches “ignore siblings” in prose while still surfacing stale sibling paths as indexed producer runs—an important hygiene tension, not a verified on-disk check.

**6. What remains valid in a clean-start lane without opening forbidden paths.**  
From this pack alone, Portolan can support: local scope (18 repos under `repos/`), 30 build/deploy **relationship-candidate** summaries (source-visible file counts/paths, not parsed topology), explicit `not_assessed` / `unknown` surfaces, and bounded next-command recipes in `oss-plan.json` / `answer-contract.md`. It cannot, from this pack alone, certify that sibling artifacts are absent, deleted, or unreadable on disk.

## Unknowns

| Surface | State | Why |
|--------|--------|-----|
| Whether sibling `20260601-054-initial-proof` outputs still exist on disk | **cannot_verify** | Forbidden to read; only path strings in `evidence-index.jsonl` |
| Whether root-level `run/` or other `.portolan/stress/*` dirs exist or were consulted during `context prepare` | **cannot_verify** | Not in allowed inputs |
| Whether `context/tool-outputs/` was created or is empty on disk | **cannot_verify** | Not present in the eight-file pack listing |
| Producer-run `verified` status for stale paths | **not_assessed** for clean-start use | Index says verified metadata at prepare time; boundary docs forbid using those paths in this lane |
| Map-bundle / graph hygiene (`summary.json`, `graph.json`, SBOM fan-out) | **not_assessed** | No map bundle in fresh context |
| OSS duplication, SBOM, Semgrep, runtime topology | **not_assessed** | `gaps.jsonl` + empty `tool-registry.json` |
| External ecosystem completeness | **unknown** | `gap-external-completeness` |
| Agent compliance with boundary in practice | **unknown** | Behavioral, outside artifacts |
| Full `evidence-index.jsonl` beyond sampled lines | **verified** for structure | File read in full (143 lines); producer-run and relationship-candidate sections reviewed |

**Bottom line:** Portolan works well as a **documented** clean-start navigation harness (boundary prose, empty tool registry in the fresh slice, scoped `oss-plan` writes, explicit unknowns). The same fresh pack **still embeds references to forbidden sibling stress artifacts** in `producer-run` records, so hygiene depends on agents honoring `agent-brief.md` / `answer-contract.md` over the index—not on the index being self-consistent with clean-start rules.
