# Requirements, Product-Vision, And Analyze Disposition

Date: 2026-06-01

Spec: `docs/specs/052-dependency-symbol-evidence-import/`

Branch: `codex/052-dependency-symbol-evidence-import`

Status: pass_to_implement

## Decision Gate

- Simpler/Faster: extend existing local `tool_outputs` normalization, map
  artifacts, and context/gap surfaces before adding scanners, daemons, MCP
  servers, or dependencies.
- Blocking Edge Cases: absent, malformed, oversized, stale, off-scope, or
  partial producer outputs; ambiguous package/symbol identity; baseline
  contamination from old `.portolan/` or root `run/` artifacts; and overclaiming
  runtime topology from metadata evidence.
- Existing Open Source: CycloneDX/Syft, dependency trees or lockfiles,
  SCIP/SemanticDB/symbol-index-style exports, and SARIF/static-analysis
  producers are evidence producers. Portolan imports their local outputs rather
  than owning PHP, JVM, or other language scanners.

## Surface Consistency

| Surface | Review Result |
| --- | --- |
| Branch | Matches spec and plan: `codex/052-dependency-symbol-evidence-import`. |
| Backlog | P6-052 outcome matches the spec: format-oriented dependency/symbol evidence import without per-language scanner ownership. Status updated to planned with implementation not started. |
| Spec | Requirements preserve local-first/read-only defaults, weak evidence states, and no complete language/runtime coverage claim. |
| Plan | Uses existing Go/stdlib and selected `tool_outputs`; no new dependency is approved. |
| Tasks | Concrete behavior and verification tasks exist; setup review tasks T001-T003 are complete. |
| Product boundary | Aligned: Portolan remains a navigation harness and normalizer over local evidence, not a replacement for enterprise code-intelligence platforms. |

## Manual Analyze Result

`/speckit-analyze` was satisfied by this manual cross-artifact review because
the work is already in a repo-local SpecKit branch and the required artifacts
are present. No blocking contradiction was found between `spec.md`, `plan.md`,
`research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `tasks.md`,
the backlog row, and the product boundary.

Clarification was not rerun. The user already resolved the blocking product
ambiguity: this slice is before scan-report UX and must be format/evidence
oriented, not a JVM/PHP adapter family.

## Independent Review Lanes

| Lane | Status | Verdict | Raw Artifact |
| --- | --- | --- | --- |
| `openrouter/moonshotai/kimi-k2.6` | verified usable output | `pass_with_changes` | `preimplementation-review-kimi-2026-06-01.md` |
| `zai/glm-5.1` | verified usable output | `pass_with_changes` | `preimplementation-review-glm-2026-06-01.md` |
| `openrouter/xiaomi/mimo-v2.5-pro` | verified usable output | `pass_with_changes` | `preimplementation-review-mimo-2026-06-01.md` |

## Finding Disposition

| Finding | Disposition |
| --- | --- |
| Clarify standalone importer path vs selected `tool_outputs` normalizer dual path. | Accepted. `plan.md` now records that both paths coexist and unification is future work. |
| Clarify oversized/stale/off-scope handling. | Accepted. `plan.md` now states direct selected-output normalization is bounded and oversized artifacts degrade to `cannot_verify`. Staleness without producer metadata remains not_assessed unless represented by local evidence or selection limitations. |
| Clarify `not_assessed` vs `cannot_verify`. | Accepted. `spec.md` and `data-model.md` now state no producer means `not_assessed`; present but unreadable/unparseable/unbounded/untrusted/off-scope producer evidence means `cannot_verify`. |
| Add privacy/local evidence note. | Accepted. `spec.md` and `data-model.md` now document local-only producer metadata and future export review needs. |
| Add additive schema compatibility note. | Accepted. `plan.md` now records no schema version bump is required for the new enum value. |
| Make mixed-language and negative-path tests explicit. | Accepted. `tasks.md` now calls out mixed PHP/JVM-style symbol evidence and malformed/oversized dependency evidence tests. |
| Baseline contamination guard needs explicit scope. | Accepted. `quickstart.md` now adds a verification command and contaminated-lane rule. `tasks.md` records this as runbook/test hygiene, not target-tree mutation by maprun. |
| Partial symbol parse degradation. | Partially accepted. The first implementation will preserve malformed producer outputs as `cannot_verify`; entry-by-entry degradation can be added if the selected symbol-index contract exposes recoverable malformed entries without requiring a new parser dependency. |

## Not Assessed

- Complete runtime, lifecycle, or service-topology inference.
- Full language semantics for PHP, JVM, Scala, or other ecosystems.
- Streaming import for very large producer outputs.
- Cursor + Composer 2.5 lane behavior after implementation; this remains for
  the stress phase.
