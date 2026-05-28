# Thread Goal Completion Audit

Date: 2026-05-27

Goal text:

> Осталось честно not_assessed: OpenCode multi-repo, black-box/metadata-heavy
> lanes, Semgrep/full Graphify/SCIP/Serena/Repomix, полная external ecosystem
> completeness, runtime topology.

## Decision Gate

- Simpler/Faster: reconcile each named surface against current evidence and
  product claims instead of expanding Portolan into a harness, service catalog,
  observability system, or native scanner suite.
- Blocking Edge Cases: complete ecosystem and complete runtime-topology claims
  require complete supplied inventories or runtime evidence for the claimed
  scope. Local repository counts, partial runtime observations, producer smokes,
  or adapter fixtures cannot prove those broad claims.
- Existing Open Source: Semgrep, Graphify, and Repomix are local OSS producer
  dependencies where bounded invocation is implemented. SCIP and Serena remain
  adjacent tool-output sources for the current slice. Portolan normalizes local
  outputs and does not vendor or replace these tools.

## Requirement-by-Requirement Status

| Requirement | Status | Evidence |
| --- | --- | --- |
| OpenCode multi-repo lane | `verified` narrowly | `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-multi-repo-bigtop-lane-2026-05-27.md` records OpenCode + `kimi-for-coding/k2p6` against `/home/fall_out_bug/projects/bigtop-landscape`, with context/map artifacts and preserved weak states. |
| OpenCode black-box/metadata-heavy lane | `verified` narrowly | `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-black-box-lane-2026-05-27.md` records the black-box selection lane with `metadata-visible`, `runtime-visible`, `claim-only`, `unknown`, and `not_assessed` evidence and a refusal to claim runtime topology. |
| Semgrep | `verified` as first-class local producer path | `specs/042-agent-adapter-layer/reviews/oss-composition-followup-2026-05-27.md` records `portolan produce semgrep` as a local OSS producer command, verifies invocation shape with a fake installed binary, and records Semgrep 1.157.0 running with a local config on a temporary target before `context prepare` preserved its JSON as `metadata-visible`. Registry/remote rule execution and broad rule-value claims remain outside the default boundary. |
| Graphify | `verified` as first-class local producer path plus raw import and source-backed `EXTRACTED` verification; non-import surfaces outside scope | `portolan produce graphify` invokes installed Graphify through a staging copy under an explicit output directory, preserving the read-only target checkout boundary. Raw `nodes`/`links` or `nodes`/`edges` import and source-backed `EXTRACTED` verification with `--root` are recorded in `specs/042-agent-adapter-layer/reviews/oss-composition-followup-2026-05-27.md`. MCP/LLM behavior, PR dashboards, source-range hashing, and large-graph performance remain outside the importer contract. |
| SCIP / Serena | `verified` narrowly for JSON symbol-index contract; real producers `not_assessed` / `blocked` | `portolan import symbol-index` is verified on `testdata/importer-normalization/symbol-index.json`. SCIP CLI help is verified. SCIP protobuf/real indexer output and real Serena export/MCP behavior remain unassessed; Serena execution is blocked in the local snapshot by `No module named serena`. |
| Repomix | `verified` as first-class local producer and file-inventory import path; source/redaction semantics `not_assessed` | `portolan produce repomix` is verified as a local OSS producer command, and bounded file-inventory import is recorded in `specs/042-agent-adapter-layer/reviews/oss-composition-followup-2026-05-27.md`. Packed source parsing as architecture facts, remote packing, MCP behavior, redaction enforcement, and token/summary semantics remain unimplemented/unassessed. |
| Complete external ecosystem completeness | `rejected` / `not_assessed` outside supplied manifest | `specs/036-scope-completeness-validation/reviews/bigtop-selection-completeness-2026-05-27.md` verifies the supplied Bigtop selection/manifest scope only. `specs/007-apache-bigtop-corpus/reviews/generic-root-stress-2026-05-27.md` records generic root discovery but explicitly says local repository discovery does not prove complete ecosystem coverage. |
| Runtime topology | `verified` for supplied local runtime relationships; complete topology `not_assessed` | `specs/044-runtime-security-boundary/reviews/runtime-topology-acceptance-audit-2026-05-27.md` verifies `runtime-visible` local observation import and `unknown` partial-topology guardrail. Complete runtime topology, live observability integration, and arbitrary producer redaction remain not assessed. |

## Product Claim Surface

Current public product claims preserve the above boundaries in:

- `docs/product-claims.md`;
- `docs/oss-composition.md`;
- `docs/agent/ACCEPTANCE.md`;
- `docs/product-backlog.md`;
- `docs/release.md`.

Safe summary:

- Portolan has verified local, read-only, evidence-backed workflows for the
  named narrow lanes and bounded adapter inputs.
- Portolan must still describe global external ecosystem completeness and
  complete runtime topology as unproven unless complete supporting inputs are
  supplied and inspected.

Unsafe summary:

- Portolan proves complete inherited estate coverage from local repository
  discovery.
- Portolan provides complete runtime topology.
- Portolan fully integrates Graphify, SCIP, Serena, Repomix, or broad Semgrep
  semantics.
- OpenCode default-permission behavior or Cursor UI behavior is verified.

## Stop Condition

This audit closes the thread goal as an evidence-reconciliation task: every
surface named in the goal has a current explicit status and artifact link. It
does not claim that every broad product capability is implemented; the broad
unproved surfaces remain explicit limitations rather than hidden success.
