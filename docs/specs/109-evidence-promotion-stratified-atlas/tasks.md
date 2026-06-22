# Tasks: Evidence Promotion and Stratified Atlas Contract (109)

## Contract and Fixtures

- [x] Add schema coverage for `classified_source`, `promotion_health`,
      `promoted_fact`, and lazy raw artifact refs.
- [x] Add canonical evidence-family registry and validation that every family
      has a bundle-level health record.
- [x] Add spec-completion validation that fails while any synthetic acceptance
      fixture family remains `not_integrated` or lacks non-stub route proof tied
      to representative fixture input and `producer_ref`.
- [x] Add the promotion matrix so each promoted fact kind has an allowed
      evidence family, evidence layer, and resolution limit.
- [x] Add default threshold config for pollution, fixture dominance, oversize,
      stale artifacts, inventory mismatch, non-exhaustive coverage, and
      low-confidence classification.
- [x] Add synthetic fixture data covering source code, docs, config, runtime
      observations, catalog descriptors, duplication output, static-analysis
      output, semantic-index placeholders, search-index rows, and LLM claims.
- [x] Add negative fixtures for generated/vendor/test pollution, broken claim
      refs, unresolved descriptor relations, stale raw artifacts, and inventory
      mismatch.
- [x] Update product docs to state that `not_integrated` is health, not
      evidence truth.
- [x] Update product docs to state the decision rules for `not_integrated`,
      `not_assessed`, `cannot_verify`, and `unknown`.

## Source Classification and Promotion

- [x] Select the source-role classifier basis after dependency, license, and
      maintenance review; prefer Linguist/go-enry style rules over a custom
      scanner.
- [x] Implement minimal local path rules only as a fallback and mark their
      low-confidence coverage limits in health.
      - 2026-06-22 blocker-fix pass: target source inventory now uses
        `git ls-files -co --exclude-standard` when Git metadata is available.
        Conservative filesystem fallback and source-inventory truncation emit
        `non_exhaustive` health.
- [x] Apply classification before symbol/search rows can contribute to promoted
      facts.
- [x] Apply classification gates to catalog, config, dependency, duplication,
      static-analysis, runtime, and claim surfaces, or emit `not_integrated`
      health where the surface is not yet wired.
- [x] Add promotion records with `fact_kind`, `evidence_layer`, `source_refs`,
      `promotion_basis`, and `resolution_limit`.

## Health and Lazy Artifacts

- [x] Compute promotion health for bundle, repo, evidence family, and fact kind.
- [x] Detect oversized raw outputs, stale artifacts, inventory mismatch,
      fixture dominance, non-source pollution, raw-only families, unsupported
      languages, and not-integrated families.
      - 2026-06-22 blocker-fix pass: family-total raw artifact size >= 500 MiB
        now emits `oversized`; representative raw inputs without promoted fact
        routes emit `raw_available_only`.
- [x] Emit observed counts, denominators, thresholds, and calculation rules for
      every threshold-derived health status.
- [x] Add lazy raw artifact refs for large producer outputs, including locator,
      size, hash when available, producer metadata, and recipe id.
- [x] Ensure strict core bundle mode keeps raw artifacts addressable but not
      embedded by default.
- [x] Define `expansion_mode` values and deterministic query behavior for
      never-produced optional artifacts versus manifest-declared missing
      artifacts.

## Query and Viewer

- [x] Update bundle-query to return stratum, health, promotion basis, source
      roles, and lazy raw refs.
- [x] Update MCP bundle-query responses with the same semantics.
- [x] Add agent acceptance smoke proving bundle-query/MCP responses expose
      strata, health, promotion basis, and bounded raw drill-down before raw
      rows.
- [x] Update viewer first screen to show coverage, health, pollution,
      staleness, oversize, and not-integrated families before hotspot volume.
- [x] Update hotspot and finding explanations so raw row count, fixtures,
      generated files, and vendor files do not look like product risk by
      default.
- [x] Add drill-down from health summary to raw refs, classified sources,
      promoted facts, claims, and gaps.

## Regression and Acceptance

- [x] Run schema validation and focused fixture tests.
- [x] Run canonical-family validation and verify missing family health fails.
- [x] Run spec-completion validation and verify synthetic `not_integrated`
      health or missing non-stub route proof fails completion.
- [x] Run standard harness smoke checks.
      - 2026-06-22 blocker-fix pass: `harness-evidence-promotion-atlas-smoke`
        covers ignored target files, invalid health enum rejection, family-total
        oversize, cap-driven `non_exhaustive` health, `package.json`
        build-metadata classification, `secret_reference_surface`, and
        required atlas build failures.
- [x] Run full Bigtop polluted-symbol regression and verify polluted rows no
      longer look like clean atlas truth.
      - 2026-06-22 current-head rerun:
        `scripts/build-evidence-promotion-atlas.sh /tmp/portolan-bigtop-20260621-193430`
        and
        `scripts/harness-bigtop-acceptance.sh /tmp/portolan-bigtop-20260621-193430`.
        Verified 3,019,203 symbol rows, `polluted_by_non_source` for 2,012,865
        rows, `dominated_by_fixture_data` for 1,214,223 test/fixture rows,
        symbol promoted-fact truncation, and oversized raw symbol health.
- [x] Run Node or JS/TS large raw artifact regression and verify lazy refs
      replace default raw embedding, disabling, or arbitrary truncation.
- [x] Run claim import negative test and verify broken refs are rejected.
- [x] Run descriptor negative test and verify unresolved relations are
      `cannot_verify`.
- [x] Run viewer smoke or browser check for first-screen health and drill-down.
- [x] Run read-only/security smoke proving approval-gated producers are not run
      by default.
- [x] Record review disposition and leave unsupported families visible as
      `not_integrated` until integrated.

## Review Requirements

- [x] Socratic OpenCode review with Opus latest.
- [x] Socratic OpenCode review with Gemini Pro latest.
- [x] Resolve or explicitly reject review findings in
      `reviews/socratic-review-disposition-2026-06-22.md`.

Do not mark this spec implemented while any canonical family in the synthetic
acceptance fixture remains `not_integrated` or lacks non-stub route proof.
Interim slices may expose `not_integrated` health, but that is slice honesty,
not spec completion.
