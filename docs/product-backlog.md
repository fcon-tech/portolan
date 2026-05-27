# Product Backlog

Portolan's backlog is organized as SpecKit feature slices. The index below is
the planning view; detailed requirements live under `specs/`.

## Roadmap Order

The roadmap is staged around agent augmentation first, then larger corpus
stress tests:

1. **Runnable substrate**: local selection input, read-only scan, graph output,
   packet rendering, importer normalization, and black-box evidence handling.
2. **Agent context preparation**: a compact pack with discovered repositories,
   OSS/tool-output candidates, query plan, and honest gaps.
3. **Agent toolbox**: a portable skill/rule pack that any agent can follow
   before answering.
4. **Agent bootstrap discovery**: an agent can discover Portolan from the
   repository root or portable skill without being told an internal guide path.
5. **Blind agent acceptance**: an agent can run the same target-agnostic mapping
   protocol against arbitrary local targets without hidden scaffolding.
6. **Landscape map orchestration**: curated local selections remain available as
   advanced input, not the first-run Cursor workflow.
7. **Product hypothesis validation**: compare Cursor-alone with
   Cursor-plus-Portolan context preparation on non-Bigtop and Bigtop targets.
8. **Useful map contents**: relationships, duplication, configuration surfaces,
   and technical-debt findings implemented because agent runs prove they are
   needed.
9. **Repeatability and scale**: evidence diff, adapter contracts, optional MCP
   and LSP/index surfaces, and larger Bigtop runs.
10. **Product validation closure**: separate product-proof gaps into independent
    validation specs before claiming Portolan exists as a product.
11. **Productization and adapters**: add release/CI proof, broader harness
    acceptance, first-wave OSS adapter evaluation, bounded query surfaces, and
    runtime/security contracts without turning Portolan into a harness.

Cursor + Composer 2.5 is the first cheap acceptance client because it is a
popular agentic IDE where reports can be read and graphs can be inspected. It is
not the product boundary. The same Portolan artifacts must remain usable from
Claude, Codex, OpenCode, pi, and other agent harnesses.

Apache Bigtop is a stress target, not the default product path. It should be
used through the same target-agnostic context preparation and blind acceptance
protocol as any other local ecosystem directory. Prepared selections and local
fixtures are preflight evidence only.

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
| P1-015 | `specs/015-blind-agent-acceptance/` | Cursor + Composer 2.5 and other agents can run a target-agnostic acceptance protocol without Bigtop-specific scaffolding. | Cursor Agent blind runs recorded as degraded for Bigtop and non-Bigtop control |
| P1-016 | `specs/016-landscape-map-orchestration/` | A CTO or agent can run Portolan against a complete local multi-repo software landscape selection and receive one evidence-backed artifact bundle with coverage, graph, findings, packet, and OSS tool-output normalization. | Implemented and merged via PR #13; full Bigtop corpus selection and local map run verified; GitHub checks not_assessed |
| P1-017 | `specs/017-landscape-root-discovery/` | An agent can map a normal local ecosystem directory without being handed a Portolan-specific selection file. | Implemented; local Bigtop root smoke verified without selection.json |
| P1-018 | `specs/018-oss-agent-context-assembly/` | Cursor and other agents receive a compact context pack with discovered repositories, OSS/tool-output candidates, query plan, and honest gaps before answering CTO-level questions. | Implemented |
| P1-020 | `specs/020-cursor-agent-skill-set/` | Cursor rules and portable skills teach the agent to use Portolan context preparation before making landscape claims. | Implemented; blind Cursor Agent discovery degraded but verified |
| P1-022 | `specs/022-oss-tool-output-assembly/` | Context preparation summarizes local jscpd and CycloneDX/Syft outputs so Cursor sees OSS evidence candidates, not just filenames. | Implemented |
| P1-023 | `specs/023-relationship-surface-assembly/` | Context preparation summarizes local Backstage, OpenAPI, AsyncAPI, and Structurizr files as relationship surface evidence candidates. | Implemented |
| P1-025 | `specs/025-oss-execution-plan/` | Context preparation emits `oss-plan.json` with safe local producer recipes for jscpd, Syft/CycloneDX, and Semgrep when outputs are missing. | Implemented |
| P1-026 | `specs/026-local-binary-bootstrap/` | Source checkouts can build a repo-local `.portolan/bin/portolan` binary so agents do not depend on fragile `go run` execution. | Implemented |
| P1-027 | `specs/027-agent-answer-contract/` | Context packs include an `answer-contract.md` that tells Cursor and other agents how to turn Portolan artifacts into CTO answers with explicit unknowns. | Implemented |
| P1-007 | `specs/007-apache-bigtop-corpus/` | Cursor + Composer 2.5 uses the generic agent path on the full Apache Bigtop landscape after landscape root discovery can map a normal ecosystem directory. | Cursor Agent blind lane degraded; gaps recorded |

## P2: Build What Agent Runs Prove Is Missing

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P2-009 | `specs/009-map-command-artifacts/` | `portolan map --root . --out .portolan/run` produces an agent-consumable artifact bundle with graph, findings, run metadata, and packet output. | Implemented |
| P2-010 | `specs/010-relationship-detection/` | Portolan detects source, metadata, runtime, and claim-backed relationships across a codebase. | Implemented |
| P2-011 | `specs/011-duplication-detection/` | Portolan reports duplicate code, duplicated config, and repeated wrappers as evidence-backed finding clusters. | Implemented for native exact source/config duplicate clusters; near-clone detection remains OSS/jscpd-backed |
| P2-012 | `specs/012-configuration-surfaces/` | Portolan maps env vars, ports, manifests, CI/CD, feature flags, and secret references without exposing secret values. | Implemented for native file-based surface inventory; semantic config/IaC analysis remains OSS/Semgrep-backed |
| P2-013 | `specs/013-technical-debt-findings/` | Portolan turns relationship, duplication, config, importer, and black-box evidence into technical-debt findings without readiness verdicts. | Implemented for rule-light debt candidates from observed and unresolved map evidence |
| P2-024 | `specs/024-agent-scale-map-summary/` | Map runs emit compact `summary.json` and unique finding IDs so agents can triage large landscapes before loading full graphs. | Implemented |

## P3: Repeatability, Surfaces, And Scale

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P3-006 | `specs/006-evidence-diff/` | Portolan can compare two evidence graphs and show what became visible, changed, or stayed unknown. | Implemented |
| P3-019 | `specs/019-portolan-scope-pruning/` | Prepared-landscape and Bigtop-specific affordances are demoted from primary product workflow; misleading or redundant surfaces are pruned safely. | Implemented for docs/help pruning |
| P3-021 | `specs/021-product-hypothesis-validation/` | Product hypotheses are falsifiable and tested as Cursor/agent augmentation instead of standalone reporting. | Headless Cursor Agent accepted evidence-index and bounded map workflow on a 30-repo real local landscape; UI Cursor/Composer and semantic search remain not_assessed |
| P3-028 | `specs/028-large-findings-jsonl/` | Map rendering handles large valid JSONL finding lines from real multi-repo landscapes without `bufio.Scanner` token failures. | Implemented |
| P3-016 | future | MCP tool surface for agents that prefer tool calls over shell commands. | Idea |
| P3-017 | future | LSP or local index surface for large-repo targeted lookups. | Idea |
| P3-018 | `specs/031-oss-adapter-contract/` | Published adapter contract, validation command, and fixtures for third-party scanner outputs. | Implemented |
| P3-022 | future | Optional export formats for SDP Trace, Backstage, or graph databases. | Idea |
| P3-029 | `specs/029-bounded-graph-index/` | Map bundles include bounded `graph-index.json` entrypoints and artifact budgets so agents do not need to load hundreds of megabytes of raw graph output first. | Implemented |
| P3-030 | `specs/030-graph-slice-command/` | Agents can extract bounded repo, edge-kind, or finding-kind JSON slices from an existing map bundle before opening full `graph.json`. | Implemented |
| P3-032 | `specs/032-context-evidence-index/` | Context packs include bounded `evidence-index.jsonl` records linking repositories, OSS/tool outputs, and gaps before agents drill into specialized artifacts. | Implemented |
| P3-033 | `specs/033-agent-command-guardrails/` | Generated answer contracts and Cursor/portable instructions prevent agents from inventing unsupported Portolan command shapes. | Implemented |

## P4: Product Validation Closure

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P4-034 | `specs/034-cursor-comparison-validation/` | Cursor-alone and Cursor-plus-Portolan are compared on the same target and question set before claiming Portolan adds value over Cursor. | Accepted on fixed local Bigtop comparison for evidence discipline and next-action quality; UI Cursor/Composer, full ecosystem completeness, runtime topology, near-clone/SBOM duplication, and OSS producer execution remain not_assessed |
| P4-035 | `specs/035-oss-producer-acceptance/` | Real local OSS producer outputs are generated or explicitly blocked before claiming OSS composition works. | Merged via PR #15 with Syft/CycloneDX verified on fixed Bigtop target; context output preservation fixed; jscpd full run failed as unbounded; Semgrep not_assessed |
| P4-036 | `specs/036-scope-completeness-validation/` | Local scope and complete inherited-estate coverage are validated separately so repository counts are not overclaimed. | Implemented and merged via PR #16; GitHub checks not_assessed |
| P4-037 | `specs/037-relationship-evidence-taxonomy/` | Relationship claims distinguish static, declared, runtime, and claim-only evidence in plain product language. | Implemented and merged via PR #17; GitHub checks not_assessed |
| P4-038 | `specs/038-product-claim-gate/` | Product and client-facing claims are accepted, narrowed, rejected, blocked, or marked not assessed based on validation evidence. | Implemented and merged via PR #18; GitHub checks not_assessed |
| P4-039 | `specs/039-bounded-jscpd-profile/` | Near-clone duplication claims are validated only through a bounded local jscpd profile, or kept failed, blocked, or not_assessed. | Implemented and merged via PR #19; GitHub checks not_assessed |

## P5: Productization And Adapter Layer

| ID | Spec | Outcome | Status |
| --- | --- | --- | --- |
| P5-040 | `specs/040-release-envelope/` | Portolan has a repeatable release and install envelope with CI, clean-checkout bootstrap smoke, and versioned artifact guidance. | Ready-for-review PR #20; local baseline/install smoke and GitHub CI verified; merge approval not_assessed |
| P5-041 | `specs/041-agent-acceptance-matrix/` | Portolan's product claim is tested across multiple agent harnesses and target shapes, with degraded lanes kept explicit. | Ready-for-review PR #20; Codex single-repo self-target lane verified; other matrix cells remain not_assessed |
| P5-042 | `specs/042-agent-adapter-layer/` | First-wave OSS/context adapters are evaluated and normalized as inputs rather than reimplemented scanners. | Ready-for-review PR #20; Graphify adapter-contract fixture verified; full imports remain not_assessed |
| P5-043 | `specs/043-readonly-query-surface/` | Agents can ask bounded read-only questions against a map bundle without loading the full graph first. | Ready-for-review PR #20; query smoke and GitHub CI verified; merge approval not_assessed |
| P5-044 | `specs/044-runtime-security-boundary/` | Runtime observation inputs and untrusted-artifact security boundaries are documented, validated, and reflected in product claims. | Ready-for-review PR #20; runtime/security smoke and GitHub CI verified; merge approval not_assessed |

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
- Product and client-facing claims must use `docs/product-claims.md` as the
  current repo-level claim boundary. Spec-local ledgers are evidence, not the
  user-facing documentation surface.
- Importer work must include license, maintenance, and privacy review before
  dependencies are added.
- Apache Bigtop testing starts immediately after the generic agent path is
  self-discoverable, the blind acceptance protocol exists, and landscape root
  discovery can run against a normal local Bigtop ecosystem directory. Local
  fixtures and generated selections may preflight Portolan commands, but they
  must not be counted as a passed Bigtop operator lane. A Bigtop acceptance run
  with omitted inventory entries is blocked, not degraded success.
