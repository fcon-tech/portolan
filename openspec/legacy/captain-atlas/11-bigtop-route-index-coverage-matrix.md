# Candidate One-Day Slice: Bigtop Route Index And Coverage Matrix

> **Status:** evidence-backed candidate slice; validates only when acceptance
> passes. Not the whole Portolan roadmap.
>
> **Authority:** `08-portolan-product-charter.md` governs the product concepts.
> `07-portolan-core-product-spec.md` remains authority for the frozen
> `system-map` schema, builder, and viewer contract until migration.
> `10-agent-frontier-to-spec-roadmap.md` governs how this candidate fits into
> the broader hypothesis-to-spec process.

## Reader And Goal

Reader: an implementation agent working on the next Portolan demo slice.

Post-read action: understand or implement one evidence-backed Bigtop slice that
may be selected by the broader roadmap process. This file is intentionally
bounded; it must not be treated as the full Portolan product scope.

## Why This Spec Exists

The agent-frontier research established two facts:

1. Clean agents without Portolan already reconstruct more system structure than
   a repo-node demo shows.
2. A manually shaped Portolan artifact helps agents orient, but remains too weak
   as an expedition surface because it lacks exact source anchors and a coverage
   matrix.

Therefore this candidate slice tests one higher product bar:

> Portolan should answer "how does this system move from declared component to
> package, deploy, test, runtime, and upstream-version boundary?" without
> forcing the admiral or a follow-up agent to redo raw corpus discovery.

## Decision Gate

**Simpler/Faster:** build two small generated artifacts over the current
system-map bundle: `route-index.jsonl` and `coverage-matrix.jsonl`. Do not add a
database, daemon, hosted service, or visual redesign.

**Blocking Edge Cases:** raw search can find facts, but it does not preserve
source boundaries, version-join confidence, runtime `not_assessed` states,
coverage gaps, path roles, or next-hop route anchors. Bigtop also contains
same-name upstream repositories whose local heads are not the same thing as
Bigtop package versions.

**Existing Open Source:** use local source search, Git metadata, manifest
parsing, and existing Portolan producers first. Semgrep-like scanners, build
graph exporters, SCIP/LSIF, jscpd, Syft, and similar tools may become producer
inputs later, but they do not replace this product contract. This slice defines
what Portolan must package for the admiral and for follow-up agents.

## Evidence Base

This spec is grounded in completed research artifacts under the local
`portolan-lab` research package:

- clean no-Portolan Bigtop baseline across low, medium, and high agent lanes;
- Portolan-shaped Bigtop artifact pass across low, medium, and high agent
  lanes;
- delta analysis showing all shaped lanes converged on route-index plus
  coverage-matrix as the next feature.

Do not treat the manually shaped artifact as proof that current Portolan already
generates this output. It is prototype evidence for this spec.

## Owned Surfaces

This work package owns:

- generated route index;
- generated coverage matrix;
- validation for route/evidence/source-boundary integrity;
- atlas or dossier rendering that reads the generated artifacts;
- Bigtop fixture output proving the route-index and coverage-matrix contract.

Out of scope:

- runtime execution;
- package builds;
- Docker/Puppet/smoke-test execution;
- CI or network checks;
- full symbol graph;
- complete dead-code, duplication, or cycle analysis;
- visual-style redesign;
- adding a new heavy indexing dependency.

## Target Corpus

Use the local Apache Bigtop corpus:

```text
/home/fall_out_bug/work/datasets/bigtop-landscape
```

Included source region:

```text
/home/fall_out_bug/work/datasets/bigtop-landscape/repos
```

Forbidden evidence sources:

- `.portolan` under the target;
- `.cursor` under the target;
- old research artifacts;
- generated atlas artifacts;
- network sources;
- package downloads;
- remote tags or branches unless a later approved probe imports them;
- target mutation outside the approved Portolan output area.

## Output Contract

The slice must produce these artifacts in the generated atlas bundle:

```text
.portolan/atlas/system-map.json
.portolan/atlas/route-index.jsonl
.portolan/atlas/coverage-matrix.jsonl
.portolan/atlas/evidence.jsonl
```

If the implementation uses another path, the receipt must record the path and
the validation command must use it. The viewer must not infer these facts from
raw files directly.

### Route Index Row

Each row in `route-index.jsonl` is one route stage for one component.

Required fields:

```json
{
  "route_id": "route:spark:bom-to-package",
  "component_id": "component:spark-distribution",
  "route_type": "package_flow",
  "stage": "bom",
  "source_path": "repos/apache-bigtop-repo/bigtop.bom",
  "source_anchor": "spark {",
  "line_start": 0,
  "line_end": 0,
  "path_role": "bom",
  "lifecycle": "active",
  "state": "verified",
  "route_quality": "high",
  "evidence_refs": ["ev:spark-bom"],
  "next_raw_check": "Open the Spark package recipe and verify Bigtop-controlled build flags."
}
```

Rules:

- `source_path` is relative to the target root.
- `line_start` and `line_end` may be `0` when stable line anchors are not
  available. In that case `source_anchor` must be non-empty.
- `state` is one of `verified`, `assumed`, `not_assessed`, `blocked`, `failed`.
- `route_quality` is one of `high`, `medium`, `low`. This is a local route
  completeness/quality heuristic, not the Portolan trust-contract `confidence`
  field from `08-portolan-product-charter.md`.
- `route_type` must be explicit. Use at least:
  - `build_flow`;
  - `package_flow`;
  - `deploy_flow`;
  - `test_flow`;
  - `runtime_layout`;
  - `version_boundary`;
  - `dependency`;
  - `docs_link`.
- `path_role` must be explicit. Use at least:
  - `bom`;
  - `package_recipe`;
  - `package_spec`;
  - `install_script`;
  - `deploy_module`;
  - `provisioner`;
  - `smoke_test`;
  - `upstream_source`;
  - `docs`;
  - `patch`;
  - `fixture`;
  - `generated`;
  - `unknown`.
- A row with `state: verified` must have at least one evidence ref that resolves
  to `evidence.jsonl`.
- A runtime-like route may be `verified` as a static-source route while its
  execution state remains `blocked` or `not_assessed`. Do not collapse source
  visibility into runtime proof.

### Coverage Matrix Row

Each row in `coverage-matrix.jsonl` classifies one manifest repository or
inventory target.

Required fields:

```json
{
  "repo_id": "apache-spark",
  "source_path": "repos/apache-spark",
  "promotion_state": "promoted",
  "related_component_ids": ["component:spark-distribution"],
  "bom_package_status": "version-boundary",
  "deploy_status": "not_assessed",
  "smoke_status": "not_assessed",
  "upstream_version_status": "mismatch-risk",
  "known_unknown_ids": ["unknown:exact-version-joins"],
  "top_evidence_refs": ["ev:spark-upstream-version", "ev:spark-bom-version"]
}
```

Rules:

- There must be one row for each of the 18 Bigtop inventory repositories.
- The inventory source for this slice is the immediate directory list under
  `<target-root>/repos`, excluding dot-directories. A validator may also accept
  an explicit `expected-repos.json` generated from that directory list and
  recorded in the receipt.
- `promotion_state` is one of `promoted`, `intentionally_unpromoted`, `omitted`,
  `blocked`.
- `bom_package_status` is one of `packaged`, `not_packaged`,
  `version-boundary`, `not_assessed`, `unknown`.
- `deploy_status` and `smoke_status` are one of `present`, `missing`,
  `blocked`, `not_assessed`, `unknown`.
- `upstream_version_status` is one of `aligned`, `mismatch-risk`,
  `not_assessed`, `unknown`.
- `omitted` requires a reason in `known_unknown_ids` or a finding in the system
  map. Silent omission is a validation failure.

### Evidence Row

This slice may reuse the existing evidence artifact if one already exists. If it
creates `evidence.jsonl`, each row must contain:

```json
{
  "id": "ev:spark-bom",
  "state": "verified",
  "kind": "file",
  "source": "local_target",
  "path": "repos/apache-bigtop-repo/bigtop.bom",
  "summary": "BOM declares Spark package version and dependency metadata.",
  "limits": ["Static source evidence only; package build was not run."]
}
```

Rules:

- Evidence paths are relative to the target root.
- No evidence path may point to forbidden evidence sources.
- `limits` must preserve degraded states such as build/runtime not assessed.

## Minimum Bigtop Slice

The first one-day implementation must cover:

1. Spark route:
   - BOM entry;
   - package recipe;
   - upstream repo/version boundary;
   - next raw check.
2. Ranger route:
   - BOM entry;
   - package recipe;
   - cross-system plugin/shim evidence;
   - upstream repo/version boundary;
   - next raw check.
3. Hadoop route:
   - BOM entry;
   - build-order dependency role;
   - upstream repo/version boundary;
   - next raw check.
4. One runtime-like route:
   - deploy/provisioner/smoke-test surfaces;
   - source-visible route evidence;
   - execution state preserved as `blocked` or `not_assessed`.
5. All 18 inventory repos:
   - classified in `coverage-matrix.jsonl`;
   - no silent omissions.

## Atlas Rendering

The atlas must expose the new artifacts in a way a reader can use without raw
JSON spelunking.

Minimum UI behavior:

- Overview or dossier shows a "Route Index" section for Spark, Ranger, Hadoop,
  and the runtime-like route.
- Each route row shows route type, stage, state, route quality, path role,
  source path/anchor, and next raw check.
- Coverage matrix shows all 18 repositories and their promotion state.
- The UI distinguishes static-source route evidence from runtime execution
  proof.
- Clicking or selecting a route must lead to the relevant dossier or source
  anchor metadata; if direct file opening is not available, show the exact path
  and anchor.

The UI may be plain. A polished visual redesign is not part of this slice.

## BDD

```gherkin
Feature: Bigtop route index and coverage matrix

Scenario: Spark route is source-anchored
  Given the Bigtop corpus is available locally
  When Portolan builds the atlas bundle
  Then route-index.jsonl contains Spark BOM, package, and upstream-version stages
  And every Spark route row has route_type, path_role, state, route_quality, source_path, and evidence_refs
  And every Spark evidence ref resolves to evidence.jsonl

Scenario: Coverage includes every inventory repository
  Given the Bigtop corpus contains 18 inventory repositories
  When Portolan builds the coverage matrix
  Then coverage-matrix.jsonl contains exactly one row for each inventory repository
  And every row has a promotion_state
  And no omitted row lacks an explicit unknown or finding

Scenario: Runtime-like route remains honest
  Given deploy, provisioner, and smoke-test source files are visible
  When Portolan emits the runtime-like route
  Then the route may be source-visible
  But Docker, Puppet, package build, smoke-test, CI, and dependency-resolution execution remain blocked or not_assessed

Scenario: Forbidden evidence is rejected
  Given the target contains .portolan or .cursor artifacts
  When route-index or coverage evidence points to those artifacts
  Then validation fails
  And the atlas does not present the affected claim as verified

Scenario: Admiral can follow a component route
  Given the atlas UI is opened
  When the admiral opens the Spark, Ranger, or Hadoop dossier
  Then the dossier shows how the component moves through BOM, package route, upstream boundary, and next raw check
```

## Validation

The implementation must provide a validation command or script that proves:

- `system-map.json` validates with the existing schema and semantic validator;
- `route-index.jsonl`, `coverage-matrix.jsonl`, and `evidence.jsonl` parse;
- every route-index evidence ref resolves;
- every coverage-matrix evidence ref resolves;
- all 18 Bigtop repos are classified;
- forbidden evidence paths are rejected;
- runtime execution claims remain `blocked` or `not_assessed` unless a later
  approved runtime probe actually ran.

Minimum command set:

```bash
git diff --check
jq empty .portolan/atlas/system-map.json
jq -c empty .portolan/atlas/route-index.jsonl
jq -c empty .portolan/atlas/coverage-matrix.jsonl
jq -c empty .portolan/atlas/evidence.jsonl
node viewer/scripts/validate-system-map.js .portolan/atlas/system-map.json
find <target-root>/repos -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort | jq -R . | jq -s . > .portolan/atlas/expected-repos.json
node viewer/scripts/route-index/validate-route-index.js .portolan/atlas .portolan/atlas/expected-repos.json
```

If the bundle is generated under the target root, substitute the target-local
`.portolan/atlas/...` paths and record them in the receipt.

`viewer/scripts/validate-system-map.js` is the accepted direct command for this
slice because it performs both JSON Schema validation and the existing semantic
checks. A wrapper such as `scripts/validate-system-map-schema.sh` may call it,
but the route/coverage validator is still required.

## Acceptance

Pass when:

1. All validation commands pass.
2. All 18 Bigtop inventory repos are classified in the coverage matrix.
3. Spark, Ranger, and Hadoop each have source-anchored route rows across BOM,
   package/upstream boundary, and next raw check.
4. At least one runtime-like route reaches deploy/provisioner/smoke-test
   surfaces while preserving blocked/not-assessed execution state.
5. The atlas UI lets a reader answer: "How does this component move through the
   Bigtop system?"
6. No route or coverage claim uses forbidden `.portolan`, `.cursor`, old
   research, generated atlas, or network evidence.

Fail when:

- the result is still mostly a repository graph;
- repositories are equal peer nodes without route context;
- runtime-like surfaces are green from static source inspection;
- omitted repositories disappear without coverage status;
- claims are not connected to resolvable evidence;
- the next agent must redo raw corpus discovery to understand Spark, Ranger, or
  Hadoop routes.

## Handoff Prompt If This Candidate Is Selected

Use this prompt only after the broader process selects this candidate as the
next one-day implementation run:

```text
Implement docs/captain-atlas/11-bigtop-route-index-coverage-matrix.md.

Work from the active product docs:
- 08-portolan-product-charter.md governs product concepts.
- 07-portolan-core-product-spec.md governs the frozen system-map contract.
- 10-agent-frontier-to-spec-roadmap.md governs the hypothesis-to-spec process.
- 11-bigtop-route-index-coverage-matrix.md is the selected one-day slice.

Target corpus:
/home/fall_out_bug/work/datasets/bigtop-landscape

Build route-index.jsonl and coverage-matrix.jsonl for Bigtop. Keep the work
local-first and read-only except approved .portolan output. Do not use .cursor,
.portolan, old research, generated atlas artifacts, network, builds, Docker,
Puppet, smoke tests, CI, or dependency-resolution as evidence.

Acceptance is not a prettier graph. Acceptance is source-anchored routes plus
coverage:
- Spark, Ranger, and Hadoop routes;
- one runtime-like route with execution blocked/not_assessed;
- all 18 inventory repos classified;
- every evidence ref resolves;
- forbidden evidence rejected;
- atlas UI/dossier exposes the route and coverage information.
```
