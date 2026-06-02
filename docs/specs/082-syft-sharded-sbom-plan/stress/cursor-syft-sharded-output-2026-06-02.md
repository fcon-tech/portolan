## Verdict: Residual gap corrected

From the allowed stress context only, Portolan now treats Syft/CycloneDX as an
18-way, repository-sharded, approval-gated acquisition plan, not a single
full-landscape SBOM command. Component and dependency claims correctly stay
`not_assessed` until local producer output exists.

### 1. Syft next action is sharded, not full-root

In `oss-plan.json`, the `cyclonedx` / Syft tool entry states the intent
explicitly:

- Status: `available_not_run`, `evidence_state`: `not_assessed`
- Reason: "18 repository shards are recommended to avoid full-root
  large-landscape scans"
- Commands: 18 labeled recipes, one per discovered repo

Each recipe:

- Scans only `.../repos/<repository-id>`.
- Writes to `context/tool-outputs/syft/<repo>.cyclonedx.json`.
- Sets `requires_user_approval: true`.
- Carries limits such as "repository shard only; do not scan the full landscape
  root in multi-repo mode" and "missing, failed, or unrun shards remain
  not_assessed/failed and must not be aggregated into component coverage".

There is no Syft command whose scan target is
`/home/fall_out_bug/projects/bigtop-landscape` without a `repos/` segment. All
18 Syft invocations point under `repos/`.

Global plan rules also require approval before slow/expensive OSS runs and
confine writes to the context output directory.

### 2. Component / dependency evidence remains `not_assessed`

| Surface | State |
| --- | --- |
| `gaps.jsonl` -> `gap-cyclonedx-not-assessed` | `not_assessed`; no local candidate output |
| `tool-registry.json` | `"tools": []`; 0 observed CycloneDX/Syft outputs |
| `agent-brief.md` | 0 local tool-output candidates; 0 observed OSS summaries |
| `evidence-index.jsonl` | 18 `producer-coverage-*-dependency` records, all `not_assessed`, tied to `gap-cyclonedx-not-assessed` |
| `producer-recommendation-landscape-dependency` | `not_assessed`; blocks component inventory and dependency/component relationships until local CycloneDX/SBOM output exists |

An agent following `query-plan.md` / `answer-contract.md` must keep Maven,
Gradle, JVM dependency, and SBOM-derived duplication claims `not_assessed` until
`tool-registry.json` shows real outputs after approved runs and
`context prepare --force`.

### 3. Portolan as a local-first navigation harness for this slice

The context bundle behaves as intended for navigation without execution:

1. `agent-brief.md`: scope, 18 repos, zero SBOM artifacts, producer-run vs gap
   boundaries.
2. `gaps.jsonl`: cyclonedx family explicitly open.
3. Evidence index: per-repo dependency coverage is `not_assessed`; landscape
   recommendation points at Syft as `candidate_only`.
4. `oss-plan.json`: concrete, bounded, approval-gated Syft recipes per repo.
5. `answer-contract.md` and `query-plan.md`: forbid inventing components or
   dependencies, or treating recommendations as verified evidence.

A disciplined agent's Syft/CycloneDX story should be: "18 repos times approved
per-repo Syft, then refresh context, then assess components/dependencies from
local SBOM files; partial shards stay not_assessed."

### Minor boundaries

- `producer-recommendation-landscape-dependency` is landscape-scoped; shard
  detail lives in `oss-plan.json`.
- Alternate CycloneDX paths exist, including a `maven-cyclonedx` sample and
  `gradle-cyclonedx` without synthesized commands. They supplement JVM
  manifests and do not reintroduce a full-root Syft scan.
- `jscpd` still has one full-landscape command in the same `oss-plan.json`;
  that is outside the Syft/CycloneDX correction under test in this branch.

### Bottom line

The previous residual gap is corrected in this stress context. Syft/CycloneDX
guidance is a repository-sharded, approval-gated plan with 18 commands aligned
with 18 repos in `repos.json`, and component/dependency evidence is consistently
`not_assessed` until local producer output is present and re-ingested. Portolan
reads here as a read-only navigation harness that routes expensive SBOM work
safely rather than implying Syft already ran or that SBOM facts exist.
