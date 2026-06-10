# Product Claims

This page is the repo-level claim boundary for Portolan. Start here before
writing README copy, a client answer, a proposal, a demo script, or an agent
instruction that says what Portolan can do.

Use [Product Quality Boundary](product-quality-boundary.md) for guarantees,
non-guarantees, maturity controls, and report-quality gating. Use this page for
individual claim wording.

Detailed evidence and review records live under
`docs/specs/038-product-claim-gate/reviews/`. This page is the maintained product
surface derived from that evidence.

## Current Client-Safe Answer

Portolan helps engineers and agents find where local code pain is visible:
duplication clusters, static findings, dependency hubs, and configuration
hotspots — then navigate there through a harness workflow and the local viewer.

The primary product path is harness-first: follow [`harness/SKILL.md`](../harness/SKILL.md),
run documented OSS recipes, build an `orient/` bundle, and open the local viewer.
The legacy Go CLI (`context prepare`, `map`) remains an optional bridge.

Evidence discipline is a **secondary** (B2B) value: hotspots and viewer nodes
cite `producer_ref` and evidence states; unknowns stay visible without blocking
first-run navigation. Portolan does not replace mature scanners — it composes
their local outputs into one orient surface.

Named examples, including the Apache Bigtop runs, are evidence records for
specific target shapes. They are not the main product path and must not be
generalized to arbitrary targets or UI Cursor behavior.

The current validated claim is narrow. Portolan supports local visible-scope
mapping, exact duplicate-cluster evidence, relationship evidence by type, and
Syft/CycloneDX component identity evidence where those artifacts exist.
Portolan should be described as a complement to Cursor and enterprise tools,
not as their replacement.

The agent acceptance matrix is defined for named harness and target shapes.
Codex, OpenCode, and Cursor Agent CLI lanes have been run on selected local
targets. That evidence shows the blind acceptance and install-prompt protocols
can produce and score Portolan context and map artifacts in those specific
local runs. It does not validate UI Cursor/Composer, arbitrary external
targets, arbitrary customer metadata/runtime formats, or all OpenCode
permission modes.

In one named local Bigtop headless Cursor comparison, the Portolan-assisted
lane reduced unsupported claims from 12 to 0 and produced equal or better next
actions across all five tested questions. Treat that as a named evidence
record, not the product narrative.

## Claim Boundary

| Claim | Status | Safe wording |
| --- | --- | --- |
| Portolan helps an agent answer CTO-level questions with fewer unsupported claims than an unaided agent on the same local target. | `narrowed` | Proven only for named comparison lanes. Do not generalize to UI Cursor/Composer or arbitrary targets. |
| Portolan is a harness for agent navigation across local software landscapes. | `accepted` | Safe when "harness" means bounded evidence routing, artifact contracts, gap labeling, and OSS-output import for agent use. Do not describe it as a coding harness or autonomous development runtime. |
| Portolan provides a local, read-only context pack and optional evidence-backed map before agents answer. | `accepted` | Safe as a capability claim for the current CLI and artifact workflow. |
| Portolan can map a normal local repository or landscape root without a generated selection file. | `narrowed` | Verified on named local targets. It reports visible local scope and weak states; it does not prove complete ecosystem coverage. |
| Portolan understands a complete inherited software estate from a local target. | `rejected` | Say local visible scope unless a supplied inventory verifies completeness. A curated manifest can narrow scope for that manifest only; global external ecosystem completeness remains unproven. |
| Portolan can provide full runtime service topology. | `not_assessed` | Runtime-visible observations can be represented from supported local files, but partial observations do not prove complete topology. Service-topology inference remains `not_assessed`. |
| Portolan composes existing OSS tool outputs instead of reimplementing mature scanners. | `narrowed` | Safe only for named local output/import contracts and recorded evidence. Agents should use native OSS CLI, skill, or MCP surfaces when available. Graphify MCP/LLM/dashboard behavior, SCIP protobuf/real indexer output, real Serena export/MCP behavior, Repomix source/redaction semantics, broad Semgrep rule value, and broad OSS producer value remain unassessed. |
| Portolan detects duplication across a landscape. | `narrowed` | Safe only for selected local duplication tool outputs, such as bounded jscpd/CPD-style evidence for the named target/profile that produced usable JSON. Native exact source/config duplicate detection has been removed; broad near-clone and component-duplication claims remain unproven. |
| Portolan detects relationships across imports, manifests, metadata, runtime exports, and claims. | `narrowed` | Safe only when the relationship evidence type is named. Runtime-visible relationships require runtime evidence. |
| Portolan has a documented security boundary for untrusted local artifacts. | `narrowed` | Safe only for the documented local CLI boundary and focused tests covering selected prompt-like text escaping, native config secret-value redaction, output path boundaries, and runtime schema handling. Do not claim broad security hardening. |
| Portolan replaces Cursor, coding harnesses, enterprise code intelligence, service catalogs, observability, modernization, or readiness tools. | `rejected` | Say Portolan is a local landscape-navigation harness and evidence-preparation complement for agents. |
| Portolan can safely support claims about UI Cursor/Composer behavior. | `rejected` | UI Cursor/Composer is outside the current required acceptance scope. Use only Cursor Agent CLI / Composer 2.5 wording until UI-specific evidence exists. |
| Portolan defines a blind acceptance matrix contract across multiple agent harnesses and target shapes. | `narrowed` | The matrix contract exists, with selected Codex, OpenCode, and Cursor Agent CLI lanes verified on named local targets. Cursor UI/Composer is outside current required acceptance scope. Arbitrary external targets remain unproven. OpenCode default-permission external-output behavior failed. |

## Limits That Must Stay Visible

- Portolan is a local evidence-preparation tool, not a live service, SLA,
  observability system, modernization engine, or control plane.
- Public community files, issue templates, and pull request templates are
  contribution infrastructure. They do not prove public adoption, response
  capacity, or support commitments.
- UI Cursor/Composer behavior is outside the current required acceptance scope.
  Cursor evidence is for headless Cursor Agent CLI on named local targets only.
- Cross-harness acceptance is narrow: selected Codex, OpenCode, and Cursor
  Agent CLI lanes are verified only for the target shapes named in the evidence
  records. OpenCode default-permission execution is verified only when
  `OUTPUT_PATH` stays inside the Portolan checkout; external output paths are
  `failed` without permission bypass. Arbitrary external targets remain
  unproven.
- Apache Bigtop evidence is a stress example. It must stay named as Bigtop
  evidence and must not become the default product narrative.
- Complete inherited-estate coverage is not proven by repository count.
- Runtime service topology remains `not_assessed` without supported runtime
  observations, and partial observations do not prove complete topology.
- Security claims are narrow: Portolan has a documented untrusted-artifact
  boundary and focused tests for selected local CLI risks, not a broad security
  certification.
- OSS producer validation is narrow and named. Producer/import paths may be
  used when installed and explicitly requested, but broad scanner coverage,
  certification, and target-independent producer value remain unproven or
  `not_assessed`.
- Output quality depends on the local evidence supplied to Portolan. Missing,
  stale, or incomplete inputs must stay visible as gaps, not be hidden as
  product success.

## Evidence

- Claim ledger:
  `docs/specs/038-product-claim-gate/reviews/product-claim-ledger-2026-05-27.md`
- Client-safe answer source:
  `docs/specs/038-product-claim-gate/reviews/client-safe-answer-2026-05-27.md`
- Cursor comparison validation:
  `docs/specs/034-cursor-comparison-validation/reviews/implementation-disposition-2026-05-26.md`
- OSS producer acceptance:
  `docs/specs/035-oss-producer-acceptance/reviews/implementation-disposition-2026-05-26.md`
- Scope completeness validation:
  `docs/specs/036-scope-completeness-validation/reviews/pr16-merge-closeout-2026-05-27.md`
- Relationship evidence taxonomy:
  `docs/specs/037-relationship-evidence-taxonomy/reviews/merge-closeout-2026-05-27.md`
- Bounded jscpd profile:
  `docs/specs/039-bounded-jscpd-profile/reviews/implementation-disposition-2026-05-27.md`
- Agent acceptance matrix:
  `docs/specs/041-agent-acceptance-matrix/reviews/acceptance-matrix-2026-05-27.md`
- Codex single-repo acceptance lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/codex-single-repo-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` single-repo acceptance lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/opencode-kimi-single-repo-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` Bigtop multi-repo acceptance lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-multi-repo-bigtop-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` black-box acceptance lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-black-box-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` install prompt lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` Russian install prompt lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-ru-install-prompt-lane-2026-05-27.md`
- OpenCode + `kimi-for-coding/k2p6` Bigtop install prompt lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-bigtop-lane-2026-05-28.md`
- OpenCode + `kimi-for-coding/k2p6` external single-repo install prompt lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-install-prompt-external-single-repo-lane-2026-05-28.md`
- OpenCode + `kimi-for-coding/k2p6` Russian external single-repo install
  prompt lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-ru-install-prompt-external-single-repo-lane-2026-05-28.md`
- OpenCode + `kimi-for-coding/k2p6` default-permission external-output lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-default-permission-external-output-lane-2026-05-28.md`
- OpenCode + `kimi-for-coding/k2p6` default-permission internal-output lane:
  `docs/specs/041-agent-acceptance-matrix/reviews/opencode-k2p6-default-permission-internal-output-lane-2026-05-28.md`
- Agent adapter layer:
  `docs/specs/042-agent-adapter-layer/reviews/implementation-disposition-2026-05-27.md`
- OSS composition follow-up:
  `docs/specs/042-agent-adapter-layer/reviews/oss-composition-followup-2026-05-27.md`
- Runtime security boundary:
  `docs/specs/044-runtime-security-boundary/reviews/implementation-disposition-2026-05-27.md`
- Runtime topology acceptance audit:
  `docs/specs/044-runtime-security-boundary/reviews/runtime-topology-acceptance-audit-2026-05-27.md`
- Bigtop generic root stress:
  `docs/specs/007-apache-bigtop-corpus/reviews/generic-root-stress-2026-05-27.md`
- Cursor Composer 2.5 Bigtop operator lane:
  `docs/specs/007-apache-bigtop-corpus/reviews/cursor-composer25-bigtop-lane-2026-05-27.md`
- Bigtop selection completeness:
  `docs/specs/036-scope-completeness-validation/reviews/bigtop-selection-completeness-2026-05-27.md`
- Thread goal completion audit:
  `docs/specs/040-release-envelope/reviews/thread-goal-completion-audit-2026-05-27.md`

## How To Use This Page

- Product copy may use only `accepted` or `narrowed` claims.
- A `narrowed` claim must carry its scope in the same paragraph.
- `rejected`, `not_assessed`, `blocked`, and `failed` claims are limitations,
  not positive claims.
- Internal tests and implementation status can support capability readiness,
  but they are not enough to claim product value.
