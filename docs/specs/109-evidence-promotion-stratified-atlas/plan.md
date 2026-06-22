# Plan: Evidence Promotion and Stratified Atlas Contract (109)

## Decision Gate

- **Simpler/Faster**: Add health badges only to the viewer.
  This is insufficient because agents and bundle-query would still consume
  unstratified facts, and future producers could repeat the same pollution.
- **Blocking Edge Cases**: Huge raw artifacts, generated/vendor/test pollution,
  unresolved catalog relations, claim-only analysis, stale indexes, and
  unsupported evidence families all need machine-readable semantics before UI
  polish is meaningful.
- **Existing Open Source**: Use established scanners and their outputs where
  possible. Portolan owns normalization, health, promotion, and viewer
  semantics, not replacement scanners. Each producer family must be classified
  before implementation as read-only-safe, approval-gated, or import-only.

## OSS Producer Safety Classification

| Tool or family | Portolan posture |
| --- | --- |
| Universal Ctags | Read-only-safe broad symbol producer when run against local files. |
| GitHub Linguist / go-enry style rules | Preferred source-role classifier basis after dependency/license review. |
| Minimal path rules | Bootstrap fallback only; must emit low-confidence and classifier-coverage health. |
| jscpd / CPD outputs | Read-only-safe when run locally with bounded shards; output is duplication finding input. |
| Syft / CycloneDX outputs | Read-only-safe for local filesystem/package metadata scans; dependency metadata only. |
| Semgrep / ast-grep outputs | Read-only-safe only for local rules and no autofix; remote rule fetch or install is approval-gated. |
| Backstage / OpenAPI / AsyncAPI / protobuf / Compose / Helm / Terraform descriptors | Import or render local files only; cluster/vendor/API access is approval-gated. |
| SCIP / LSIF indexers | Approval-gated unless a concrete recipe proves no target mutation, build invocation, dependency install, or network access. |
| CodeQL | Import existing SARIF as static-analysis input; database creation/build execution is approval-gated. |
| Joern | Approval-gated for CPG generation because it can be heavyweight; imported outputs remain static-analysis input unless fact kind is explicit. |

## Implementation Strategy

Deliver the capability through coherent slices without narrowing the product
contract:

1. Contract and schema layer
   - Add source-role, promotion-health, lazy-raw-artifact, and promoted-fact
     schema vocabulary.
   - Add the canonical evidence-family registry and validation that every
     family has a health record.
   - Add completion validation that fails while any synthetic acceptance-family
     record remains `not_integrated` or lacks non-stub route proof tied to
     representative fixture input.
   - Extend manifest/query schemas without removing existing fields.
   - Add validation fixtures for every evidence family, including
     `not_integrated`.

2. Classification and promotion layer
   - Adopt a mature source-role classifier basis where practical
     (Linguist/go-enry style rules after dependency/license review).
   - Use minimal local path rules only as a bootstrap fallback, and mark their
     confidence and coverage limits in health.
   - Classify source roles before symbol, search, relationship, static-analysis,
     catalog, duplication, and claim surfaces influence promoted facts.
   - Encode the promotion matrix from the spec so each fact kind has an allowed
     evidence family and limit.
   - Keep confidence and classifier evidence visible.

3. Health layer
   - Compute bundle, repo, family, and fact-kind health.
   - Detect oversize, fixture dominance, non-source pollution, stale artifacts,
     inventory mismatch, unsupported languages, raw-only families, and missing
     integrations.
   - Record observed counts, denominators, thresholds, and calculation rules for
     threshold-derived statuses.

4. Lazy raw artifact layer
   - Represent large raw producer outputs through locators, sizes, hashes,
     producer metadata, and recipe ids.
   - Keep strict core bundles small while preserving drill-down and provenance.

5. Query and viewer layer
   - Update bundle-query results to return stratum, promotion basis, health, and
     lazy raw artifact refs.
   - Put health and integration limitations on the first viewer screen.
   - Update hotspot ranking explanations so volume is not mistaken for risk.

6. Regression and acceptance layer
   - Add synthetic fixture coverage for all strata and negative cases.
   - Re-run current Bigtop/large-bundle acceptance; if the reusable corpus is
     unavailable, record a PR blocker rather than substituting synthetic proof.
   - Add a Node or JS/TS large raw artifact scenario where the correct behavior
     is lazy representation, not disabling or arbitrary truncation.

## Files and Areas Likely Affected

- `harness/contracts/*.schema.json`
- `scripts/build-portolan-bundle.sh`
- `scripts/build-symbol-index.sh`
- `scripts/build-search-index.sh`
- `scripts/scan-*.sh`
- `scripts/portolan-bundle-query.sh`
- `viewer/scripts/bundle-query*.js`
- `viewer/src/*`
- `harness/SKILL.md`
- `docs/demo-runbook.md`
- `docs/product-claims.md`
- focused fixtures and smoke tests

The Go CLI remains frozen for this capability unless a bugfix is required for a
legacy bridge.

## Acceptance Checks

- `jq empty harness/contracts/*.json`
- `scripts/validate-atlas-schemas.sh`
- `scripts/harness-portolan-smoke.sh`
- `scripts/harness-bundle-query-smoke.sh`
- `scripts/harness-bundle-query-mcp-smoke.sh`
- `scripts/harness-bigtop-acceptance.sh` on a current full-scale Bigtop bundle
  with symbol-index pollution, fixture/test dominance, truncation, and oversized
  raw symbol health verified
- Node or JS/TS large raw artifact regression with lazy raw refs
- canonical-family validation fails if a family health record is missing
- spec-completion validation fails if synthetic fixture health contains
  `not_integrated` or lacks non-stub route proof
- focused viewer smoke or browser check for first-screen health
- focused bundle-query and MCP smoke showing agent-visible strata, promotion
  basis, health, and bounded raw drill-down
- `git diff --check`

## Risks

- Classifier rules may become too broad and hide useful evidence. Mitigation:
  keep confidence, raw refs, and searchable raw rows.
- Health vocabulary may grow too fast. Mitigation: add statuses only when a
  query/viewer/acceptance scenario needs them.
- Integrating precise semantic producers may mutate targets. Mitigation:
  approval-gated classification is required before any recipe can be added.
- Viewer can overemphasize warnings and obscure useful navigation. Mitigation:
  first screen must pair health with immediate drill-down routes.

## Completion Boundary

Spec 109 is complete only when the product contract is implemented across the
named artifact surfaces, every canonical family has manifest/query/viewer health,
and the synthetic acceptance fixture proves a non-stub integration route for
every family.

A PR that covers only one producer family is a valid slice if missing families
are explicit as `not_integrated`, but it is not completion of this spec.
