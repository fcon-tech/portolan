# Portolan 07-Spec Implementation Checklist

Controlling spec: `docs/captain-atlas/07-portolan-core-product-spec.md`.
This checklist maps every code change and deliverable to its spec task and BDD
scenario. It is the Task A deliverable.

Authority rule: BDD scenarios are acceptance authority. A task marked done here
is only credible if its scenario verdict is `verified` in
`bdd-feature-report.md`.

## Task A — Orchestrator And Scope Guard

- [x] Existing public graph dashboard marked as a failed spike in handoff text:
      `docs/captain-atlas/README.md` records the graph-first demo as superseded
      by the meaning-first system-map UI.
- [x] Task checklist mapping code changes to this spec: this file.
- [x] Migrate/adapt/replace decisions recorded (see Decision Log below).
- [x] Work on one branch: `portolan-core-spec-impl`.
- [x] Chosen schema direction: `schema/system-map.schema.json` + adapter from
      existing bundle artifacts (not a new graph transport).

## Decision Log (migrate / adapt / replace)

| Surface | Decision | Rationale |
|---------|----------|-----------|
| `schema/evidence-graph.schema.json` | preserve (compatibility input) | spec line 100-105; not replaced this pass |
| `viewer/src/app.js` | replace (graph-first → meaning-first) | spec line 106-107; full-framework replacement is a stop-condition, but a vanilla-JS rebuild is permitted |
| `viewer/src/styles.css` | replace | tied to app.js rebuild |
| `viewer/scripts/serve.js` | adapt (add `/bundle/system-map.json` + `/api/system-map`) | reuse plumbing |
| `viewer/scripts/bundle-query.js` | adapt (add `system-map` family) | reuse query substrate |
| bundle producers (`build-atlas-surfaces.sh`, `build-atlas-facts.sh`, …) | adapt (add `build-system-map.sh`) | pack existing producers |
| OSS renderer | pack (vanilla SVG, no new dep) | Task I delta check (`oss-kill-gates-scorecard.json` row `c4-renderer-delta`) |

## Task B — Entity Stratification And Normalization → Feature 2

| Scenario | Code | Verdict |
|----------|------|---------|
| distinct object types | `viewer/scripts/build-system-map.js` (component/repository/surface/relationship/finding/unknown) | verified |
| system map validates | `scripts/validate-system-map-schema.sh` | verified |
| Bigtop classifies correctly | `scripts/harness-system-map-smoke.sh` | verified |
| no default peer surface nodes | adapter `isPromotableComponent` + validator check | verified |

## Task C — C4 Builder → Feature 3

| Scenario | Code | Verdict |
|----------|------|---------|
| Context boxes | adapter `c4.context_boxes` | verified |
| Families from roles | adapter `assignC4Family` | verified |
| deterministic grouping | harness determinism re-check | verified |
| family priority order | `C4_FAMILY_RULES` order | verified |
| Component level for selected family | `renderC4Components` family filter | verified |
| counts attached | family `surface_count`/`finding_count`/`unknown_count` | verified |
| inferred/incomplete placement marked | `c4_family: unknown` + validator | verified |
| click routes from C4 box to dossier | `findById` resolver | verified |

## Task D — Component Dossier → Feature 4

| Scenario | Code | Verdict |
|----------|------|---------|
| dossier renderer (component/repo/surface/relationship/C4 box/detail) | `render*Dossier` / `renderBoundedDetail` | verified |
| sections: what/why/C4/repos/surfaces/relationships/findings/unknowns/next | `renderComponentDossier` | verified |
| retired-component dossier (Sqoop) | browser harness | verified |
| surface dossiers (release/support matrix, mailing list) | `renderSurfaceDossier` + harness | verified |
| no visible object without dossier/detail route | validator route checks | verified |

## Task E — UI Rebuild → Feature 5, 9

| Scenario | Code | Verdict |
|----------|------|---------|
| first screen overview/main components/relationships/risks/gaps/next | `renderOverview` | verified |
| C4 view | `renderC4` | verified |
| component + surface list | `renderComponents` / `renderSurfaces` | verified |
| default map meaningful components only | `renderMap` | verified |
| secondary objects behind filters/dossiers | map surface toggle, Surfaces view | verified |
| remove/disable non-functional controls | no fake controls; toggle is functional | verified |
| fix Read-more behavior | stays in overview | verified |
| contextual help, no noisy inline `?` | none added | verified |
| desktop-first layout | CSS `@media` minimal | verified |

## Task F — Cursor First-Run Path → Feature 1, Gate 3

| Scenario | Code/Artifact | Verdict |
|----------|---------------|---------|
| install/first-run instructions updated | `docs/captain-atlas/00-product-contract.md` + AGENTS.md | verified |
| Cursor run scorecard | `docs/captain-atlas/cursor-agent-cli-scorecard.json` | verified |
| cursor-agent stream-json run | transcript in scorecard evidence_files | verified |
| target read-only default | git status proof | verified |
| launch/handoff path | receipt `viewer_handoff` | verified |

## Task G — Agent Q&A And Selected Code → Feature 6

| Scenario | Code/Artifact | Verdict |
|----------|---------------|---------|
| bounded queries: overview/components/surfaces/relationships/dossiers/findings/gaps/selected-code | `bundle-query.js` `system-map` family + existing families | verified |
| Q&A prompts + answer rubric | `docs/captain-atlas/agent-qa-rubric.md` | verified |
| selected-code test cases | `docs/captain-atlas/agent-qa-rubric.md` | verified |
| prohibit raw-JSONL primary interaction | captain prompt mandates bounded queries | verified |

## Task H — Testing And QA

| Scenario | Code/Artifact | Verdict |
|----------|---------------|---------|
| schema/unit tests for object types | `validate-system-map.js` semantic checks | verified |
| validation command validates instance | `validate-system-map-schema.sh` | verified |
| semantic checks (identity, refs, route/kind, promotion, eligibility) | `validate-system-map.js` | verified |
| Bigtop fixture tests | `harness-system-map-smoke.sh` | verified |
| non-Bigtop fixture test | polyglot scan in BDD report Gate 4 | verified |
| browser tests overview/C4/map/dossier/surfaces/search/filters/help | `harness-viewer-system-map-smoke.sh` | verified (search/filters/help added) |
| route/DOM contract tests | browser harness + validator | verified |
| read-only checks | Cursor run git-status proof | verified |
| output under .portolan/ + instruction files | Cursor run proof | verified |
| target-network/install approval checks | `docs/captain-atlas/network-install-approval.md` | verified (marked not_assessed with reason) |
| wide-desktop screenshots | `docs/captain-atlas/viewer-screenshots/` | verified |
| negative regression tests | `harness-viewer-system-map-smoke.sh` negative block | verified |

## Task I — OSS Fit Check

| Scenario | Code/Artifact | Verdict |
|----------|---------------|---------|
| renderer/C4 delta check before any dep | `oss-kill-gates-scorecard.json` row `c4-renderer-delta` | verified |
| record license/maturity/integration/local-first/decision | scorecard fields | verified |

## Acceptance Gates

| Gate | Verdict | Evidence |
|------|---------|----------|
| G1 data model | verified | harness-system-map-smoke.sh |
| G2 UI | verified | harness-viewer-system-map-smoke.sh |
| G3 agent first run | verified | cursor-agent-cli-scorecard.json |
| G4 repeatability | verified | polyglot scan in bdd-feature-report.md |
| G5 client demo readiness | verified | cold-reader-check.md + screenshots + limitations list |
