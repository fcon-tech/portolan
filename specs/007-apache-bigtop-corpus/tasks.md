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

- [x] T014 Add a Bigtop skill-smoke runbook under `docs/test-corpora/apache-bigtop.md` or `specs/007-apache-bigtop-corpus/`.
- [x] T015 Prepare a minimal local Bigtop fixture selection that uses current Portolan commands and does not fetch upstream resources.
- [x] T016 Run Cursor + Composer 2.5 against the portable Portolan agent guide and the minimal Bigtop fixture.
  - Status: degraded evidence.
  - 2026-05-20: Cursor Agent with `composer-2.5` read the guide, Cursor rule,
    and fixture and returned a smoke report, but shell commands were blocked
    inside the Cursor lane. Treat Cursor command execution as `not_assessed`;
    use the separate local CLI smoke for verified scan/packet evidence.
- [x] T017 Record a gap ledger under `specs/007-apache-bigtop-corpus/reviews/` with agent workflow failures, missing relationships, missing duplication, missing configuration surfaces, missing technical-debt findings, packet usefulness gaps, and unsupported agent inferences.
- [x] T018 Update `docs/product-backlog.md` to prioritize only the product gaps proven by the smoke.

## Deferred Work

- [ ] D001 Add a manifest-to-selection generator.
- [ ] D002 Add a minimal local fixture derived from the Bigtop manifest.
- [ ] D003 Add schema validation beyond JSON syntax.
- [ ] D004 Add optional corpus preparation commands with explicit network
  approval and cache boundaries.
