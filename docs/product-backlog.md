# Product Backlog

Portolan's backlog is organized as SpecKit feature slices. The index below is
the planning view; detailed requirements live under `specs/`.

## P0: Make The Product Runnable

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P0-001 | `specs/001-local-evidence-graph/` | A user can run a local read-only scan over a selection file and receive a JSON evidence graph. | Ready for implementation |
| P0-002 | `specs/002-selection-inventory/` | A user can declare repositories, metadata files, runtime exports, and claim files without editing code. | Backlog spec |
| P0-003 | `specs/003-human-readable-packet/` | A user can generate a readable packet from the same evidence graph without creating a second truth source. | Backlog spec |

## P1: Make The Evidence Useful

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P1-004 | `specs/004-importer-normalization/` | Portolan can import existing OSS/tool outputs through reviewed adapters. | Backlog spec |
| P1-005 | `specs/005-black-box-profile/` | Portolan can represent black-box systems through metadata, runtime observations, and claims. | Backlog spec |
| P1-006 | `specs/006-evidence-diff/` | Portolan can compare two evidence graphs and show what became visible, changed, or stayed unknown. | Backlog spec |

## P2: Make The Ecosystem Work

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P2-007 | `specs/007-apache-bigtop-corpus/` | Apache Bigtop corpus profile defines the first realistic OSS ecosystem for fixture and acceptance testing. | Backlog spec |
| P2-008 | future | Optional export formats for SDP Trace, Backstage, or graph databases. | Idea |
| P2-009 | future | Signed or attestable evidence graph package for customer handoff. | Idea |
| P2-010 | future | Published importer contract and fixture suite for third-party adapters. | Idea |

## Backlog Rules

- Every P0/P1 item must map to exactly one SpecKit feature directory before
  implementation.
- A backlog row is not implementation approval by itself.
- Each implementation slice must preserve local-first, read-only defaults.
- Importer work must include license, maintenance, and privacy review before
  dependencies are added.
