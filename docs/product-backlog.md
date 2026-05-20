# Product Backlog

Portolan's backlog is organized as SpecKit feature slices. The index below is
the planning view; detailed requirements live under `specs/`.

## Roadmap Order

The roadmap is intentionally staged from a small runnable product to a realistic
ecosystem acceptance run:

1. **Primary assembly**: local selection input, read-only scan, evidence graph,
   and packet generation.
2. **Evidence usefulness**: importer normalization, black-box profiles, diffs,
   and optional export/adapter contracts.
3. **Final acceptance corpus**: Apache Bigtop validates the assembled workflow
   only after the primary product loop exists.

The Apache Bigtop corpus is not a mid-roadmap implementation target. It is the
final stress test for Portolan and the operator assembly after the smaller local
fixtures prove the product contract.

## P0: Make The Product Runnable

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P0-001 | `specs/001-local-evidence-graph/` | A user can run a local read-only scan over a selection file and receive a JSON evidence graph. | Implemented |
| P0-002 | `specs/002-selection-inventory/` | A user can declare repositories, metadata files, runtime exports, and claim files without editing code. | Implemented |
| P0-003 | `specs/003-human-readable-packet/` | A user can generate a readable packet from the same evidence graph without creating a second truth source. | Implemented |

## P1: Make The Evidence Useful

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P1-004 | `specs/004-importer-normalization/` | Portolan can import existing OSS/tool outputs through reviewed adapters. | Implemented |
| P1-005 | `specs/005-black-box-profile/` | Portolan can represent black-box systems through metadata, runtime observations, and claims. | Implemented |
| P1-006 | future | Portolan can compare two evidence graphs and show what became visible, changed, or stayed unknown. | Idea |

## P2: Make The Ecosystem Work

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P2-008 | future | Optional export formats for SDP Trace, Backstage, or graph databases. | Idea |
| P2-009 | future | Published importer contract and fixture suite for third-party adapters. | Idea |
| P2-010 | future | Signed or attestable evidence graph package for customer handoff. | Idea |
| P2-007 | `specs/007-apache-bigtop-corpus/` | Apache Bigtop corpus profile defines the final realistic OSS ecosystem acceptance run for the assembled Portolan workflow. | Final acceptance backlog spec |

## Backlog Rules

- Every P0/P1 item must map to exactly one SpecKit feature directory before
  implementation.
- A backlog row is not implementation approval by itself.
- Each implementation slice must preserve local-first, read-only defaults.
- Importer work must include license, maintenance, and privacy review before
  dependencies are added.
- Apache Bigtop work must stay behind the primary runnable product loop; use
  small local fixtures until scan, packet, importer, and black-box behavior are
  coherent enough for ecosystem-scale validation.
