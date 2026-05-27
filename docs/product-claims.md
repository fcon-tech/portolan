# Product Claims

This page is the repo-level claim boundary for Portolan. Start here before
writing README copy, a client answer, a proposal, a demo script, or an agent
instruction that says what Portolan can do.

Detailed evidence and review records live under
`specs/038-product-claim-gate/reviews/`. This page is the maintained product
surface derived from that evidence.

## Current Client-Safe Answer

Portolan is useful when an agent needs a bounded local evidence pack before it
answers architecture or estate questions.

In the fixed local Bigtop headless Cursor comparison, the Portolan-assisted
lane reduced unsupported claims from 12 to 0 and produced equal or better next
actions across all five tested questions.

The practical value is evidence discipline. Portolan prepares local context,
map, graph, finding, and answer-contract artifacts that tell an agent what is
visible, what is only declared, what is missing, and what remains unknown. That
makes an agent less likely to turn local files, partial scans, or planned OSS
integrations into broader claims.

The current validated claim is narrow. Portolan supports local visible-scope
mapping, exact duplicate-cluster evidence, relationship evidence by type, and
Syft/CycloneDX component identity evidence where those artifacts exist.
Portolan should be described as a complement to Cursor and enterprise tools,
not as their replacement.

The agent acceptance matrix is now defined, with one narrow Codex single-repo
lane verified on the Portolan repository as a self-target. That evidence shows
the blind acceptance prompt can produce and score Portolan context and map
artifacts in Codex for this local repository; it does not validate UI
Cursor/Composer, OpenCode, external single-repo targets, multi-repo targets, or
black-box/metadata-heavy targets.

## Claim Boundary

| Claim | Status | Safe wording |
| --- | --- | --- |
| Portolan helps an agent answer CTO-level questions with fewer unsupported claims than Cursor alone. | `narrowed` | Proven for the fixed local Bigtop headless Cursor comparison. Do not generalize to UI Cursor/Composer. |
| Portolan provides a local, read-only context pack and optional evidence-backed map before agents answer. | `accepted` | Safe as a capability claim for the current CLI and artifact workflow. |
| Portolan understands a complete inherited software estate from a local target. | `rejected` | Say local visible scope unless a supplied inventory verifies completeness. |
| Portolan can provide full runtime service topology. | `not_assessed` | Runtime topology requires supported local runtime observations; partial observations remain incomplete and full topology remains unassessed. |
| Portolan composes existing OSS tool outputs instead of reimplementing mature scanners. | `narrowed` | Safe for Syft/CycloneDX component identity on the fixed Bigtop target, bounded jscpd JSON ingestion on the Portolan repository smoke target, and Graphify adapter-contract confidence mapping on the local fixture. Full Graphify graph import, SCIP/Serena import, Repomix parsing, and Semgrep remain unassessed. |
| Portolan detects duplication across a landscape. | `narrowed` | Safe for native exact source/config duplicate clusters and bounded jscpd near-clone evidence only for the named target/profile that produced usable JSON. Bigtop near-clone and SBOM duplicate risk remain unproven. |
| Portolan detects relationships across imports, manifests, metadata, runtime exports, and claims. | `narrowed` | Safe only when the relationship evidence type is named. Runtime-visible relationships require runtime evidence. |
| Portolan has a documented security boundary for untrusted local artifacts. | `narrowed` | Safe only for the documented local CLI boundary and focused tests covering selected prompt-like text escaping, native config secret-value redaction, output path boundaries, and runtime schema handling. Do not claim broad security hardening. |
| Portolan replaces Cursor, coding harnesses, enterprise code intelligence, service catalogs, observability, modernization, or readiness tools. | `rejected` | Say Portolan is a local discovery and evidence-preparation complement. |
| Portolan can safely support claims about UI Cursor/Composer behavior. | `not_assessed` | Use headless Cursor comparison wording until UI Cursor/Composer is validated. |
| Portolan defines a blind acceptance matrix contract across multiple agent harnesses and target shapes. | `narrowed` | The matrix contract exists, but only the Codex single-repo self-target lane is verified. Cursor UI/Composer, OpenCode, external single-repo targets, multi-repo, and black-box/metadata-heavy cells remain `not_assessed`. |

## Limits That Must Stay Visible

- Portolan is a local evidence-preparation tool, not a live service, SLA,
  observability system, modernization engine, or control plane.
- UI Cursor/Composer behavior is `not_assessed`; the comparison evidence is for
  headless Cursor on the fixed local Bigtop target.
- Cross-harness acceptance is narrow: only the Codex single-repo self-target
  matrix lane is verified; the other matrix cells and external single-repo
  targets remain `not_assessed`.
- Complete inherited-estate coverage is not proven by repository count.
- Runtime service topology remains `not_assessed` without supported runtime
  observations, and partial observations do not prove complete topology.
- Security claims are narrow: Portolan has a documented untrusted-artifact
  boundary and focused tests for selected local CLI risks, not a broad security
  certification.
- OSS producer validation is narrow: Syft/CycloneDX component identity is
  verified for the fixed target, bounded jscpd JSON ingestion is verified on
  the Portolan repository smoke target, Graphify adapter-contract confidence
  mapping is verified on a local fixture, the full Bigtop near-clone run remains
  unproven, and full Graphify import, SCIP/Serena import, Repomix parsing, and
  Semgrep remain `not_assessed`.
- Output quality depends on the local evidence supplied to Portolan. Missing,
  stale, or incomplete inputs must stay visible as gaps, not be hidden as
  product success.

## Evidence

- Claim ledger:
  `specs/038-product-claim-gate/reviews/product-claim-ledger-2026-05-27.md`
- Client-safe answer source:
  `specs/038-product-claim-gate/reviews/client-safe-answer-2026-05-27.md`
- Cursor comparison validation:
  `specs/034-cursor-comparison-validation/reviews/implementation-disposition-2026-05-26.md`
- OSS producer acceptance:
  `specs/035-oss-producer-acceptance/reviews/implementation-disposition-2026-05-26.md`
- Scope completeness validation:
  `specs/036-scope-completeness-validation/reviews/pr16-merge-closeout-2026-05-27.md`
- Relationship evidence taxonomy:
  `specs/037-relationship-evidence-taxonomy/reviews/merge-closeout-2026-05-27.md`
- Bounded jscpd profile:
  `specs/039-bounded-jscpd-profile/reviews/implementation-disposition-2026-05-27.md`
- Agent acceptance matrix:
  `specs/041-agent-acceptance-matrix/reviews/acceptance-matrix-2026-05-27.md`
- Codex single-repo acceptance lane:
  `specs/041-agent-acceptance-matrix/reviews/codex-single-repo-lane-2026-05-27.md`
- Agent adapter layer:
  `specs/042-agent-adapter-layer/reviews/implementation-disposition-2026-05-27.md`
- Runtime security boundary:
  `specs/044-runtime-security-boundary/reviews/implementation-disposition-2026-05-27.md`

## How To Use This Page

- Product copy may use only `accepted` or `narrowed` claims.
- A `narrowed` claim must carry its scope in the same paragraph.
- `rejected`, `not_assessed`, `blocked`, and `failed` claims are limitations,
  not positive claims.
- Internal tests and implementation status can support capability readiness,
  but they are not enough to claim product value.
