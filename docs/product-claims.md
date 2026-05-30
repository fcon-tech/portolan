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

The agent acceptance matrix is now defined, with a Codex single-repo control
lane and OpenCode + `kimi-for-coding/k2p6` lanes verified for the local target
shapes that were run. OpenCode is verified for single-repo self-target, Bigtop
multi-repo, black-box/metadata-heavy selection, and the copyable English and
Russian install prompts on the Portolan self-target. The English install prompt
is also verified on one external single-repo target and the local Bigtop
multi-repo target. The Russian install prompt is verified on one external
single-repo target. Cursor Agent CLI with Composer 2.5 is verified for the
local Bigtop multi-repo operator lane. That evidence shows the blind acceptance
and install prompts can produce and score Portolan context and map artifacts in
these local harness runs. It does not validate UI Cursor/Composer, arbitrary
external single-repo targets, arbitrary customer metadata/runtime formats,
arbitrary external multi-repo targets, or OpenCode default-permission behavior
for arbitrary output paths. The OpenCode default-permission external-output
lane failed because the harness auto-rejected the external output directory,
while a repo-local `.portolan/...` output path worked without permission
bypass.

The Apache Bigtop generic CLI stress path and Cursor Agent / Composer 2.5
operator lane are now verified for the local landscape root: Portolan mapped
`/home/fall_out_bug/projects/bigtop-landscape` without a generated selection
file, discovered 18 source-visible repositories, and preserved `unknown`,
`cannot_verify`, and `not_assessed` states. This does not validate Cursor UI
behavior, which is outside the current required acceptance scope, and does not
prove complete external ecosystem coverage.

For the supplied Bigtop selection and corpus manifest, Portolan records the
curated manifest scope as represented/visible coverage. This narrows the
completeness claim to the supplied manifest; it still does not prove complete
external ecosystem coverage beyond that manifest.

## Claim Boundary

| Claim | Status | Safe wording |
| --- | --- | --- |
| Portolan helps an agent answer CTO-level questions with fewer unsupported claims than Cursor alone. | `narrowed` | Proven for the fixed local Bigtop headless Cursor comparison. Do not generalize to UI Cursor/Composer. |
| Portolan provides a local, read-only context pack and optional evidence-backed map before agents answer. | `accepted` | Safe as a capability claim for the current CLI and artifact workflow. |
| Portolan can map the fixed local Apache Bigtop landscape root without a generated selection file. | `narrowed` | Verified for the local `/home/fall_out_bug/projects/bigtop-landscape` CLI run and Cursor Agent CLI / Composer 2.5 operator lane: 18 source-visible repositories, 555 findings, and preserved weak states. Do not treat this as UI Cursor evidence or complete ecosystem coverage. |
| Portolan understands a complete inherited software estate from a local target. | `rejected` | Say local visible scope unless a supplied inventory verifies completeness. For the supplied Bigtop selection and corpus manifest, curated manifest coverage is represented; global external ecosystem completeness remains unproven. |
| Portolan can provide full runtime service topology. | `not_assessed` | Runtime-visible observations can be represented from supported local files, but partial observations do not prove complete topology. Service-topology inference remains `not_assessed`. |
| Portolan composes existing OSS tool outputs instead of reimplementing mature scanners. | `narrowed` | Safe for Syft/CycloneDX component identity on the fixed Bigtop target, bounded jscpd JSON ingestion on the Portolan repository smoke target, first-class local Semgrep producer execution with local config/output, first-class local Graphify producer execution through a read-only staging copy, Graphify adapter-contract confidence mapping, raw Graphify node-link import with optional source-backed `EXTRACTED` verification, bounded SCIP/Serena-style JSON symbol-index import, first-class local Repomix producer execution, and bounded Repomix file-inventory import. Graphify MCP/LLM/dashboard behavior, SCIP protobuf/real indexer output, real Serena export/MCP behavior, Repomix source/redaction semantics, and broad Semgrep rule value remain unassessed. |
| Portolan detects duplication across a landscape. | `narrowed` | Safe for native exact source/config duplicate clusters and bounded jscpd near-clone evidence only for the named target/profile that produced usable JSON. Bigtop near-clone and SBOM duplicate risk remain unproven. |
| Portolan detects relationships across imports, manifests, metadata, runtime exports, and claims. | `narrowed` | Safe only when the relationship evidence type is named. Runtime-visible relationships require runtime evidence. |
| Portolan has a documented security boundary for untrusted local artifacts. | `narrowed` | Safe only for the documented local CLI boundary and focused tests covering selected prompt-like text escaping, native config secret-value redaction, output path boundaries, and runtime schema handling. Do not claim broad security hardening. |
| Portolan replaces Cursor, coding harnesses, enterprise code intelligence, service catalogs, observability, modernization, or readiness tools. | `rejected` | Say Portolan is a local discovery and evidence-preparation complement. |
| Portolan can safely support claims about UI Cursor/Composer behavior. | `rejected` | UI Cursor/Composer is outside the current required acceptance scope. Use only Cursor Agent CLI / Composer 2.5 wording until UI-specific evidence exists. |
| Portolan defines a blind acceptance matrix contract across multiple agent harnesses and target shapes. | `narrowed` | The matrix contract exists, with a Codex single-repo control lane, OpenCode + `kimi-for-coding/k2p6` single-repo/multi-repo/black-box lanes, OpenCode + `kimi-for-coding/k2p6` English and Russian install-prompt self-target execution, OpenCode + `kimi-for-coding/k2p6` English and Russian install-prompt execution on one external single-repo target, OpenCode + `kimi-for-coding/k2p6` English install-prompt Bigtop multi-repo execution, OpenCode default-permission execution with repo-local output, and Cursor Agent CLI / Composer 2.5 Bigtop multi-repo verified. Cursor UI/Composer is outside current required acceptance scope. Arbitrary external targets remain unproven. OpenCode default-permission external-output behavior failed. |

## Limits That Must Stay Visible

- Portolan is a local evidence-preparation tool, not a live service, SLA,
  observability system, modernization engine, or control plane.
- Public community files, issue templates, and pull request templates are
  contribution infrastructure. They do not prove public adoption, response
  capacity, or support commitments.
- UI Cursor/Composer behavior is outside the current required acceptance scope;
  the comparison and Bigtop operator evidence are for headless Cursor Agent CLI
  on the fixed local Bigtop target.
- Cross-harness acceptance is narrow: Codex single-repo control, OpenCode +
  `kimi-for-coding/k2p6` single-repo/multi-repo/black-box, OpenCode +
  `kimi-for-coding/k2p6` English and Russian install prompts on the Portolan
  self-target, OpenCode + `kimi-for-coding/k2p6` English and Russian install
  prompt on one external single-repo target, OpenCode +
  `kimi-for-coding/k2p6` English install prompt on the local Bigtop multi-repo
  target, and Cursor Agent CLI / Composer 2.5 Bigtop multi-repo lanes are
  verified. OpenCode default-permission execution is verified only when
  `OUTPUT_PATH` stays inside the Portolan checkout; external output paths are
  `failed` without permission bypass. Cursor UI is outside current required
  acceptance scope, and arbitrary external targets remain unproven.
- Bigtop generic-root CLI stress and Cursor Agent CLI / Composer 2.5 operator
  execution are verified for the local landscape root. Curated Bigtop
  selection coverage is verified only for the supplied manifest; complete
  external ecosystem coverage remains unproven outside that manifest.
- Complete inherited-estate coverage is not proven by repository count.
- Runtime service topology remains `not_assessed` without supported runtime
  observations, and partial observations do not prove complete topology.
- Security claims are narrow: Portolan has a documented untrusted-artifact
  boundary and focused tests for selected local CLI risks, not a broad security
  certification.
- OSS producer validation is narrow: Syft/CycloneDX component identity is
  verified for the fixed target, bounded jscpd JSON ingestion is verified on
  the Portolan repository smoke target, first-class local Semgrep producer
  execution is verified with a local config and output path, first-class local
  Graphify producer execution is verified through a read-only staging copy,
  first-class local Repomix producer execution is verified, Graphify
  adapter-contract confidence mapping plus raw node-link import and
  source-backed `EXTRACTED` verification are verified, and bounded Repomix
  file-inventory import plus bounded SCIP/Serena-style JSON symbol-index import
  are verified. The full Bigtop near-clone run, Graphify MCP/LLM/dashboard
  behavior, SCIP protobuf/real indexer output, real Serena export/MCP behavior,
  Repomix source/redaction semantics, and broad Semgrep rule value remain
  unproven or `not_assessed`.
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
- OpenCode + `kimi-for-coding/k2p6` single-repo acceptance lane:
  `specs/041-agent-acceptance-matrix/reviews/opencode-kimi-single-repo-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` Bigtop multi-repo acceptance lane:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-multi-repo-bigtop-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` black-box acceptance lane:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-black-box-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` install prompt lane:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` Russian install prompt lane:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-ru-install-prompt-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` Bigtop install prompt lane:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-bigtop-lane-2026-05-28.md`
- OpenCode + `kimi-for-coding/k2p6` external single-repo install prompt lane:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-external-single-repo-lane-2026-05-28.md`
- OpenCode + `kimi-for-coding/k2p6` Russian external single-repo install
  prompt lane:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-ru-install-prompt-external-single-repo-lane-2026-05-28.md`
- OpenCode + `kimi-for-coding/k2p6` default-permission external-output lane:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-default-permission-external-output-lane-2026-05-28.md`
- OpenCode + `kimi-for-coding/k2p6` default-permission internal-output lane:
  `specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-default-permission-internal-output-lane-2026-05-28.md`
- Agent adapter layer:
  `specs/042-agent-adapter-layer/reviews/implementation-disposition-2026-05-27.md`
- OSS composition follow-up:
  `specs/042-agent-adapter-layer/reviews/oss-composition-followup-2026-05-27.md`
- Runtime security boundary:
  `specs/044-runtime-security-boundary/reviews/implementation-disposition-2026-05-27.md`
- Runtime topology acceptance audit:
  `specs/044-runtime-security-boundary/reviews/runtime-topology-acceptance-audit-2026-05-27.md`
- Bigtop generic root stress:
  `specs/007-apache-bigtop-corpus/reviews/generic-root-stress-2026-05-27.md`
- Cursor Composer 2.5 Bigtop operator lane:
  `specs/007-apache-bigtop-corpus/reviews/cursor-composer25-bigtop-lane-2026-05-27.md`
- Bigtop selection completeness:
  `specs/036-scope-completeness-validation/reviews/bigtop-selection-completeness-2026-05-27.md`
- Thread goal completion audit:
  `specs/040-release-envelope/reviews/thread-goal-completion-audit-2026-05-27.md`

## How To Use This Page

- Product copy may use only `accepted` or `narrowed` claims.
- A `narrowed` claim must carry its scope in the same paragraph.
- `rejected`, `not_assessed`, `blocked`, and `failed` claims are limitations,
  not positive claims.
- Internal tests and implementation status can support capability readiness,
  but they are not enough to claim product value.
