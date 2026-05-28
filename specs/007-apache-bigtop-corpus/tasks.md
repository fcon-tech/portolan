# Tasks: Apache Bigtop Test Corpus

**Input**: `specs/007-apache-bigtop-corpus/spec.md`
**Prerequisites**: `specs/007-apache-bigtop-corpus/plan.md`

## Phase 1: Corpus Contract

- [x] T001 Add `schema/corpus-manifest.schema.json` for curated test corpus
  manifests.
- [x] T002 Add `corpora/apache-bigtop/manifest.json` pinned to Bigtop 3.5.0
  official metadata.
- [x] T003 Record Bigtop source references, layers, targets, evidence states,
  acceptance checks, and scope exclusions.

## Phase 2: Human-Readable Test Strategy

- [x] T004 Add `docs/test-corpora/apache-bigtop.md` explaining why this corpus
  is useful and how testing should be phased.
- [x] T005 Document retired-project and runtime/package-surface handling without
  granting default network access.
- [x] T006 Document Cursor + Composer 2.5 as the operator assembly
  being tested by the Bigtop corpus.

## Phase 3: Backlog And Navigation

- [x] T007 Add SpecKit artifacts for feature slice 007.
- [x] T008 Update the product backlog to point P2-007 at the Bigtop corpus
  slice.
- [x] T009 Update repository navigation so the corpus and schema are easy to
  find.

## Phase 4: Verification

- [x] T010 Run `jq empty` over JSON schemas and corpus manifest.
- [x] T011 Run Go baseline tests.
- [x] T012 Run whitespace and placeholder checks.
- [x] T013 Commit the completed slice.

## Phase 5: Immediate Post-Skill Smoke

- [x] T014 Add an initial Bigtop skill-smoke runbook under `docs/test-corpora/apache-bigtop.md` or `specs/007-apache-bigtop-corpus/`.
- [x] T015 Prepare a minimal local Bigtop fixture selection that uses current Portolan commands and does not fetch upstream resources.
- [x] T016 Run Cursor + Composer 2.5 against the portable Portolan agent guide and the minimal Bigtop fixture.
  - Status: degraded evidence.
  - 2026-05-20: Cursor Agent with `composer-2.5` read the guide, Cursor rule,
    and fixture and returned a smoke report, but shell commands were blocked
    inside the Cursor lane. Treat Cursor command execution as `not_assessed`;
    use the separate local CLI smoke for verified scan/packet evidence.
- [x] T017 Record a gap ledger under `specs/007-apache-bigtop-corpus/reviews/` with agent workflow failures, missing relationships, missing duplication, missing configuration surfaces, missing technical-debt findings, packet usefulness gaps, and unsupported agent inferences.
- [x] T018 Update `docs/product-backlog.md` to prioritize only the product gaps proven by the smoke.

## Phase 6: Real Blind Operator Lane

- [x] T019 Wait for `specs/014-agent-bootstrap-discovery/` to make Portolan
  self-discoverable from generic agent inputs.
- [x] T020 Wait for `specs/015-blind-agent-acceptance/` to define the allowed
  target-agnostic prompt, run ledger, and status taxonomy.
- [x] T021 Run the blind protocol against a real local Apache Bigtop checkout.
  - Status 2026-05-26: blocked on `specs/017-landscape-root-discovery/`.
    Cursor + Composer 2.5 is available, but handing it a generated
    `selection.json` would make the run non-blind and product-invalid.
  - Prep 2026-05-26: full ecosystem checkouts were created under
    `/home/fall_out_bug/projects/bigtop-landscape/repos`, selection was generated
    at `/home/fall_out_bug/projects/bigtop-landscape/selection.json`, and local
    Portolan map preflight wrote the five artifacts under
    `/home/fall_out_bug/projects/bigtop-landscape/run`. Operator transcript is
    still pending, and generated selection preflight is not acceptance, so T021
    remains open.
  - CLI stress 2026-05-27: generic root workflow ran without `selection.json`
    against `/home/fall_out_bug/projects/bigtop-landscape` and wrote context
    plus map artifacts under `/tmp/portolan-bigtop-generic-20260527221217`.
    It discovered 18 `source-visible` child repositories and preserved
    `unknown`, `cannot_verify`, and `not_assessed` states. This verifies the
    Portolan CLI/root-discovery stress path but does not complete the Cursor +
    Composer 2.5 operator transcript, so T021 remains open.
  - Operator lane 2026-05-27: Cursor Agent CLI / Composer 2.5 ran the blind
    protocol against `/home/fall_out_bug/projects/bigtop-landscape`, wrote
    context plus map artifacts under
    `/tmp/portolan-cursor-composer25-bigtop-20260527222530/agent-output`, and
    produced a scored answer with local artifact citations plus explicit
    `unknown`, `cannot_verify`, and `not_assessed` states. See
    `reviews/cursor-composer25-bigtop-lane-2026-05-27.md`.
- [x] T022 If the local Apache Bigtop checkout is absent, record the run as
  blocked or `not_assessed`; do not substitute the fixture as acceptance proof.
  - Status 2026-05-27: not applicable for the completed lane because the local
    Apache Bigtop checkout was present at
    `/home/fall_out_bug/projects/bigtop-landscape`.
- [x] T023 Update Bigtop gap ledger and product backlog only with generic
  product gaps proven by the blind run.
  - Status 2026-05-27: updated the Bigtop operator ledger and product claim
    surface with the generic root-discovery limits, OSS producer gaps, and
    weak evidence states proven by the blind run. No Bigtop-specific product
    behavior was promoted.

## Deferred Work

- [x] D001 Add a manifest-to-selection generator.
  - Implemented by spec 016 as `portolan selection generate-bigtop`.
- [ ] D002 Add a minimal local fixture derived from the Bigtop manifest.
- [ ] D003 Add schema validation beyond JSON syntax.
- [ ] D004 Add optional corpus preparation commands with explicit network
  approval and cache boundaries.
