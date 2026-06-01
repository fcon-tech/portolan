# Pre-Implementation Review: Kimi

Lane: `openrouter/moonshotai/kimi-k2.6`

Status: verified usable output

## Raw Output

| # | Finding | Severity | Evidence | Recommendation |
|---|---------|----------|----------|----------------|
| 1 | Slice respects local-first, read-only boundary; no daemon, write-back, or remote fetch introduced. | pass | Proposed slice; plan says no dependency additions | None. |
| 2 | `metadata-visible` constraint on dependency evidence prevents runtime-topology overclaim. | pass | Proposed first implementation slice | None. |
| 3 | Mismatch risk between existing standalone CycloneDX/symbol-index importers and selected `tool_outputs` map normalizer. Dual-path maintenance should be clarified. | major | Packet notes both standalone importers and selected-output normalization | Clarify whether standalone importer paths coexist or are deprecated. |
| 4 | Oversized/stale artifact handling is underspecified. | major | Edge cases list oversized/off-scope artifacts, proposed slice only names malformed output | Add concrete bound or record as not assessed/deferred. |
| 5 | Baseline contamination from old `.portolan/` or root `run/` is flagged as blocking but unclear whether code or runbook handles it. | major | Edge case list and quickstart protocol | State whether it is in-slice code behavior or clean-start guidance. |
| 6 | `symbol-index` semantic correctness and call relationships remain not assessed. | pass | Packet notes standalone importer wording and proposed slice | None. |
| 7 | Mixed-language acceptance lacks a concrete test proposal. | minor | Spec intent names PHP/JVM/mixed-language acceptance cases | Add mixed-language producer output to test matrix. |
| 8 | Symbol indices may contain proprietary identifiers. | minor | Security/privacy plane with no detailed note | Document local-only trust boundary and future export risk. |
| 9 | Schema enum addition should note backward compatibility. | minor | `selection.schema.json` enum change | Note additive enum extension and no version bump. |

Verdict: `pass_with_changes`

Required before code start: clarify dual-path importer intent, oversized/stale
handling, baseline contamination scope, and mixed-language test coverage.
