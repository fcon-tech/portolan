# Implementation Plan: OSS Producer Acceptance

**Branch**: `035-oss-producer-acceptance` | **Date**: 2026-05-26 |
**Spec**: `specs/035-oss-producer-acceptance/spec.md`

## Summary

Run a local acceptance check for real OSS producer outputs on the fixed Bigtop
landscape. This slice validates whether Portolan can move from planned OSS
producer recipes to real generated evidence. It does not add a scanner runtime,
installer, network access, daemon behavior, target mutation, or committed raw
producer outputs.

## Decision Gate

- Simpler/Faster: Use the existing `portolan context prepare` `oss-plan.json`
  and spec-local evidence ledgers instead of adding new CLI behavior.
- Blocking Edge Cases: OSS producers may be absent, slow, unsafe, network-backed,
  or too noisy/private to commit. Missing or unsafe producers must remain
  `blocked`, `not_assessed`, or `unsafe`; they are not successful validation.
- Existing Open Source: The candidate producers are existing local tools:
  `jscpd` for near-clone evidence, `syft`/CycloneDX for SBOM/component identity,
  and Semgrep for local config-backed structural findings. Portolan should
  consume or plan their local outputs rather than reimplement them.

## Technical Context

**Language/Version**: Go 1.x for existing Portolan CLI; markdown/json/jsonl for
this validation slice.

**Primary Dependencies**: Existing local CLI commands only:
`portolan context prepare`, `jq`, and local executable discovery for `jscpd`,
`syft`, and `semgrep`.

**Storage**: Runtime outputs go under `/tmp/portolan-035-bigtop-context`.
Committed evidence is limited to spec-local markdown ledgers and summaries under
`specs/035-oss-producer-acceptance/reviews/`.

**Testing**: Documentation/ledger checks plus baseline repository checks. No Go
behavior change is planned unless validation discovers a Portolan CLI defect.

**Target Platform**: Local developer machine with
`/home/fall_out_bug/projects/bigtop-landscape`.

**Constraints**: No network calls, no target repository mutation, no credential
collection, no installation of producer tools without explicit approval, and no
committed private raw source or producer output payloads.

## Constitution Check

- Local-first/read-only: PASS. The validation reads a local target and writes to
  explicit output paths.
- Evidence state honesty: PASS. Missing, failed, and not assessed producers
  remain distinct; the OSS value claim is accepted only for observed producer
  outputs.
- Complement, do not replace: PASS. This slice checks existing OSS producers
  instead of building native scanner replacements.
- SpecKit before implementation: PASS. `spec.md`, this plan, and `tasks.md`
  define the work before execution.
- Test-first for behavior: PASS with scope note. This is validation/documentation
  work; future CLI behavior changes require focused Go tests first.

## Project Structure

```text
specs/035-oss-producer-acceptance/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- producer-acceptance-ledger.md
|-- reviews/
|   `-- <preconditions-ledgers-and-dispositions>.md
`-- tasks.md
```

## Phase 0: Research

Resolve producer selection, safety boundaries, blocked-state semantics, and why
this slice should not add a general scanner orchestration engine.

## Phase 1: Design And Contracts

Design outputs:

- `data-model.md`: producer, run, safety decision, output disposition, and
  evidence impact.
- `contracts/producer-acceptance-ledger.md`: required ledger sections.
- `quickstart.md`: local commands for Bigtop context preparation and producer
  availability checks.

## Post-Design Constitution Check

- Local-first/read-only: PASS. Commands are local and write under explicit
  output directories.
- Evidence state honesty: PASS. `verified`, `blocked`, `failed`, `unsafe`, and
  `not_assessed` are distinct.
- Complement, do not replace: PASS. Real OSS tools remain external producers.
- SpecKit before implementation: PASS. Design artifacts exist before execution.
- Test-first for behavior: PASS with no runtime behavior change.

## Complexity Tracking

No constitution violations.
