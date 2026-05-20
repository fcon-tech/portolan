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
- [x] T006 Document Cursor + Composer 2.5 / Kimi 2.6 as the operator assembly
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

## Deferred Work

- [ ] D001 Add a manifest-to-selection generator.
- [ ] D002 Add a minimal local fixture derived from the Bigtop manifest.
- [ ] D003 Add schema validation beyond JSON syntax.
- [ ] D004 Add optional corpus preparation commands with explicit network
  approval and cache boundaries.
