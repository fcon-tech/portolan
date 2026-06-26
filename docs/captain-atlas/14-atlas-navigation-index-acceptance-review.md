# Acceptance Review: Atlas Navigation Index

> **Status:** review of the first implementation of
> `13-atlas-navigation-index.md`.
>
> **Date:** 2026-06-26.
>
> **Verdict:** standalone generation and validation are verified. Product
> readiness remains under review because the generated atlas is still
> fixture-backed and has UX/generalization risks listed below.

## Reader And Goal

Reader: a product or implementation agent deciding whether the first Atlas
Navigation Index implementation is ready to become the next baseline.

Post-read action: understand what passed, what is blocked, what needs fixing,
and which next product step is justified.

## Verification

Verified:

- `portolan-core` unit and BDD tests passed.
- Dependency rule passed.
- Bigtop standalone navigation bundle generated and validated.
- `portolan-self` standalone navigation bundle generated and validated.
- Combined multi-corpus acceptance bundle generated and validated.
- Query surface smoke passed for route, findings, probes, and receipt queries.
- Bigtop review HTML was exported.
- `portolan-self` review HTML was exported.

Blocked:

- `/portolan:map` end-to-end integration is blocked because the current
  `portolan-self` target does not have `.portolan/intake.json`.

Not assessed:

- real browser interaction beyond generated HTML presence and shell/mock tests;
- human UX quality after manual review by the admiral;
- whether fixture-backed extraction generalizes beyond the two target profiles.

## Review Artifacts

Generated review bundles:

- Bigtop bundle: `/tmp/portolan-review-nav-bigtop`
- Bigtop HTML: `/tmp/portolan-review-nav-bigtop/atlas.html`
- `portolan-self` bundle: `/tmp/portolan-review-nav-self`
- `portolan-self` HTML: `/tmp/portolan-review-nav-self/atlas.html`

These are local review artifacts, not committed product output.

## Demo Critique

The new atlas is materially richer than the previous component/surface demo.
It now exposes:

- route stages;
- coverage rows;
- first-class findings;
- unknown probes;
- machine receipt validation;
- follow-up-agent query commands;
- combined multi-corpus acceptance.

This addresses the core product failure found in the frontier research: raw
agents could describe more navigational structure than the old demo showed.

However, the current implementation is still a fixture-backed atlas contract,
not a general producer:

- Bigtop has one package/distribution route, not broad route extraction.
- `portolan-self` has four implementation/toolchain routes, not broad route
  extraction.
- Many route anchors are ambiguous or missing.
- The viewer shows the new objects, but the UX has not yet been judged by a
  human walkthrough.

## Findings

### Fixed During Review: Route Quality Overstated Ambiguous Anchors

Several generated route stages have `line_start: 0`, ambiguous anchors, and
`route_quality: high`. The validator records `anchor-ambiguity` as `verified`
and says quality is preserved.

Risk: the admiral sees a high-quality route even when the source anchor did not
resolve to a precise location. That weakens the atlas trust contract.

Resolution: route quality now downgrades once per affected route when any
anchor is ambiguous, and the validator summary says that explicitly.

### Fixed During Review: Exported HTML Title Was Not Escaped

`export-shell.mjs` safely inlines `__ATLAS` and `__NAV_ATLAS`, but the HTML
`<title>` still interpolates the CLI title directly.

Risk: a crafted title or target-derived title containing HTML control sequences
can break document structure. The current common path is local, but this is an
avoidable export-safety gap.

Resolution: title text is escaped before injection into `<title>`.

### Major: Product Acceptance Is Fixture-Backed

The implementation honestly labels rows as `fixture_backed`, but the current
route/finding/probe content is still profile-authored.

Risk: tests and validators can go green while the product has not yet learned
to extract routes generally.

Recommended fix:

- treat this as an accepted contract/demo slice, not a producer-complete slice;
- make the next implementation step either producer generalization or a clearly
  scoped UX review, not another fixture expansion.

### Minor: Review Lanes Blocked By Tooling

The external OpenCode review lanes could not run because `codex-subagent`
failed internally with `ERR_INVALID_ARG_TYPE`.

Risk: no independent reviewer-lane verdict was available for this review.

Recommended fix:

- retry external review after the subagent tool issue is resolved;
- until then, mark external review as `blocked`.

## Product Status

`13-atlas-navigation-index.md` should be treated as:

- implemented as a fixture-backed generated atlas contract;
- standalone accepted by local tests and harness;
- not yet product-complete as a general route producer;
- not yet UX-approved by human walkthrough;
- `/portolan:map` end-to-end blocked on missing intake for the current self
  target.

## Recommended Next Step

Do not start a new unrelated feature.

Run human product review on the generated HTML. After that, choose one of:

- producer generalization: convert fixture-backed routes into real local
  producers;
- atlas UX/navigation: improve how routes, coverage, findings, probes, and
  receipts are read by the admiral;
- probe planner: turn unknown probes into managed next-expedition steps.
