# Implementation Plan: Apache Bigtop Test Corpus

**Branch**: `007-apache-bigtop-corpus`
**Spec**: `specs/007-apache-bigtop-corpus/spec.md`
**Created**: 2026-05-20

## Summary

Add Apache Bigtop as Portolan's immediate post-skill-pack acceptance corpus.
This slice is documentation and data only: define the corpus schema, commit the
Bigtop manifest, document phased testing, and index the slice in the product
backlog. No repository cloning, networked scan behavior, or importer
implementation is in scope.

## Technical Context

- Language/runtime: Go for Portolan implementation, JSON for corpus profile.
- Product constraints: local-first, read-only, no network by default.
- Existing contracts: evidence states from `schema/evidence-graph.schema.json`.
- External source of truth: official Apache Bigtop release and documentation
  pages, plus official project repositories and Attic pages.

## Constitution Check

- **Local-first and read-only**: The manifest stores upstream URLs as references;
  default scans must consume local selections or prepared fixtures.
- **Evidence state honesty**: Manifest targets explicitly carry evidence states.
- **Complement existing tools**: Bigtop packaging and smoke tests are external
  context, not code to reimplement.
- **SpecKit before implementation**: This slice defines spec, plan, and tasks
  before any scanner behavior.
- **Test-first**: Acceptance checks define the fixture and gap-recording
  behavior required before deeper detector work continues.

## Project Structure

```text
corpora/apache-bigtop/manifest.json
docs/test-corpora/apache-bigtop.md
schema/corpus-manifest.schema.json
specs/007-apache-bigtop-corpus/spec.md
specs/007-apache-bigtop-corpus/plan.md
specs/007-apache-bigtop-corpus/tasks.md
```

## Phases

1. Add schema and manifest for immediate post-skill acceptance smoke.
2. Add human-readable corpus rationale and test strategy.
3. Add SpecKit artifacts and backlog index entry that put Bigtop immediately
   after the skill pack.
4. Verify JSON syntax, Go baseline, whitespace, and placeholder hygiene.

## Out Of Scope

- Cloning the full Bigtop ecosystem.
- Adding a corpus preparation command.
- Implementing manifest-to-selection generation.
- Implementing runtime or Docker observation.
- Adding third-party dependencies for JSON Schema validation.

## Risks

- Upstream Bigtop metadata changes over time. Mitigation: pin the first profile
  to Bigtop 3.5.0 and record `last_reviewed`.
- Component repository HEAD may not match release BOM versions. Mitigation:
  store BOM facts as `metadata-visible`.
- Full corpus may be too large for routine tests. Mitigation: require a smaller
  local fixture subset before scanner acceptance.
