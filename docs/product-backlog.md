# Product Backlog

Portolan's backlog is organized as SpecKit feature slices. The index below is
the planning view; detailed requirements live under `specs/`.

## Roadmap Order

The roadmap is intentionally staged from a cheap agent acceptance loop into an
immediate Bigtop-driven product test:

1. **Runnable substrate**: local selection input, read-only scan, graph output,
   packet rendering, importer normalization, and black-box evidence handling.
2. **Agent toolbox**: a portable skill/rule pack that any agent can follow
   before answering.
3. **Agent bootstrap discovery**: an agent can discover Portolan from the
   repository root or portable skill without being told an internal guide path.
4. **Blind agent acceptance**: an agent can run the same target-agnostic mapping
   protocol against arbitrary local targets without hidden scaffolding.
5. **Landscape map orchestration**: the product-grade path maps a local
   software landscape selection, not only one repository root. This bridges
   single-root smoke commands to CTO-scale multi-repo mapping.
6. **Bigtop full-landscape acceptance immediately after the generic agent path**:
   Cursor + Composer 2.5 runs the blind protocol against a full local Apache
   Bigtop landscape selection: the Bigtop meta-repo, every included product
   repository or represented inventory entry, metadata, runtime/package
   surfaces, claims, black boxes, and imported OSS tool outputs.
7. **Useful map contents**: relationships, duplication, configuration surfaces,
   and technical-debt findings implemented because the Bigtop full-landscape
   run proves they are needed.
8. **Repeatability and scale**: evidence diff, adapter contracts, optional MCP
   and LSP/index surfaces, and larger Bigtop runs.

Cursor + Composer 2.5 is the first cheap acceptance client because it is a
popular agentic IDE where reports can be read and graphs can be inspected. It is
not the product boundary. The same Portolan artifacts must remain usable from
Claude, Codex, OpenCode, pi, and other agent harnesses.

Apache Bigtop is no longer deferred until the end. It starts immediately after
the generic agent path and landscape map orchestration are self-discoverable
enough to test honestly, then returns later as a larger stress test. The point
is to prevent development for development's sake without hiding product gaps
behind a Bigtop-specific operator packet or a partial single-repository smoke.

## P0: Runnable Evidence Substrate

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P0-001 | `specs/001-local-evidence-graph/` | A user can run a local read-only scan over a selection file and receive a JSON evidence graph. | Implemented |
| P0-002 | `specs/002-selection-inventory/` | A user can declare repositories, metadata files, runtime exports, and claim files without editing code. | Implemented |
| P0-003 | `specs/003-human-readable-packet/` | A user can generate a readable packet from the same evidence graph without creating a second truth source. | Implemented |
| P0-004 | `specs/004-importer-normalization/` | Portolan can import existing OSS/tool outputs through reviewed adapters. | Implemented |
| P0-005 | `specs/005-black-box-profile/` | Portolan can represent black-box systems through metadata, runtime observations, and claims. | Implemented |

## P1: Agent Toolbox MVP

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P1-008 | `specs/008-agent-skill-pack/` | Any coding agent can read a portable Portolan guide or Cursor rule and run the expected mapping workflow without prompt-by-prompt handholding. | Implemented |
| P1-014 | `specs/014-agent-bootstrap-discovery/` | An agent can discover Portolan's mapping workflow from the Portolan root or portable skill without being told an internal guide path. | Implemented |
| P1-015 | `specs/015-blind-agent-acceptance/` | Cursor + Composer 2.5 and other agents can run a target-agnostic acceptance protocol without Bigtop-specific scaffolding. | Protocol implemented; first full blind operator runs pending evidence |
| P1-016 | `specs/016-landscape-map-orchestration/` | A CTO or agent can run Portolan against a complete local multi-repo software landscape selection and receive one evidence-backed artifact bundle with coverage, graph, findings, packet, and OSS tool-output normalization. | Implemented and merged via PR #13; full Bigtop corpus selection and local map run verified; GitHub checks not_assessed |
| P1-007 | `specs/007-apache-bigtop-corpus/` | Cursor + Composer 2.5 uses the generic agent path on the full Apache Bigtop landscape after landscape orchestration can enforce 100% corpus representation. | Unblocked from P1-016; next required evidence is a real Cursor + Composer 2.5 blind run using the full Bigtop landscape selection |

## P2: Build What The Bigtop Smoke Proves Is Missing

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P2-009 | `specs/009-map-command-artifacts/` | `portolan map --root . --out .portolan/run` produces an agent-consumable artifact bundle with graph, findings, run metadata, and packet output. | Implemented |
| P2-010 | `specs/010-relationship-detection/` | Portolan detects source, metadata, runtime, and claim-backed relationships across a codebase. | Implemented |
| P2-011 | `specs/011-duplication-detection/` | Portolan reports duplicate code, duplicated config, and repeated wrappers as evidence-backed finding clusters. | Bigtop-gated backlog spec |
| P2-012 | `specs/012-configuration-surfaces/` | Portolan maps env vars, ports, manifests, CI/CD, feature flags, and secret references without exposing secret values. | Bigtop-gated backlog spec |
| P2-013 | `specs/013-technical-debt-findings/` | Portolan turns relationship, duplication, config, importer, and black-box evidence into technical-debt findings without readiness verdicts. | Bigtop-gated backlog spec |

## P3: Repeatability, Surfaces, And Scale

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P3-006 | `specs/006-evidence-diff/` | Portolan can compare two evidence graphs and show what became visible, changed, or stayed unknown. | Implemented |
| P3-016 | future | MCP tool surface for agents that prefer tool calls over shell commands. | Idea |
| P3-017 | future | LSP or local index surface for large-repo targeted lookups. | Idea |
| P3-018 | future | Published adapter contract and fixture suite for third-party scanners. | Idea |
| P3-019 | future | Optional export formats for SDP Trace, Backstage, or graph databases. | Idea |

## Backlog Rules

- Every P0/P1/P2 item must map to exactly one SpecKit feature directory before
  implementation.
- A backlog row is not implementation approval by itself.
- Each implementation slice must preserve local-first, read-only defaults.
- Agent-facing work must remain harness-independent. Cursor-specific files are
  allowed only as a cheap acceptance client wrapper over the portable guide.
- Agent bootstrap must be target-agnostic. Product surfaces must not include
  Bigtop-specific operator choreography, handpicked file lists, or hidden prompt
  scaffolding.
- Findings must cite local evidence and preserve `source-visible`,
  `metadata-visible`, `runtime-visible`, `claim-only`, `unknown`, and
  `cannot_verify`.
- Importer work must include license, maintenance, and privacy review before
  dependencies are added.
- Apache Bigtop testing starts immediately after the generic agent path is
  self-discoverable, the blind acceptance protocol exists, and landscape map
  orchestration can run a complete local Bigtop selection. Local fixtures may
  preflight Portolan commands, but they must not be counted as a passed Bigtop
  operator lane. A Bigtop acceptance run with omitted inventory entries is
  blocked, not degraded success.
