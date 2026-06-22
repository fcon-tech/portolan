# Requirements And Product-Vision Drift Review: Spec 109

Date: 2026-06-22
Mode: REVIEW -> IMPLEMENT

## Decision Gate

- Simpler/Faster: viewer-only health badges would be smaller, but would leave
  bundle-query, MCP, schema validation, and agent workflows consuming
  unstratified evidence. Rejected.
- Blocking Edge Cases: canonical family coverage, claim-only boundaries, lazy
  raw artifacts, unsupported-family visibility, pollution/fixture health, and
  completion validation require machine-readable bundle artifacts.
- Existing Open Source: no scanner replacement is needed. The implementation
  composes existing local producer outputs and source artifacts; Portolan owns
  normalization, health, promotion, and validation.

## Assessment

- Requirements: spec, plan, and tasks agree that full completion requires every
  canonical family to have bundle-level health and synthetic non-stub route
  proof. Implementation must not call a one-family slice complete.
- UX: viewer first screen must show family health and degraded states before
  hotspot volume.
- DX: query and MCP must expose strata, health, promotion basis, resolution
  limits, raw refs, and classified sources so agents can inspect why a fact was
  promoted.
- Maintainability: implementation should stay in harness/viewer scripts and
  contracts because the Go CLI is frozen for new product capability.

## Disposition

- Accepted: implement a local evidence-promotion normalizer over existing
  bundle and producer artifacts.
- Accepted: add completion validation that fails when canonical family health
  is missing, `not_integrated`, or lacks evidence-backed route proof.
- Accepted: keep absent real-target input as `not_assessed`, not success.
- Accepted: keep claims in `claim` stratum with `claim-only`; do not create
  promoted facts from claim statement text.

## Verification Plan

- `jq empty harness/contracts/*.json schema/*.json`
- `node -c viewer/scripts/evidence-promotion-atlas.js`
- `scripts/harness-evidence-promotion-atlas-smoke.sh`
- `scripts/harness-bundle-query-smoke.sh`
- baseline checks from `AGENTS.md` after implementation.
