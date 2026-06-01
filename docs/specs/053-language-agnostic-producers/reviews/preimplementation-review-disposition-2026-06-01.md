# Pre-Implementation Review Disposition

Date: 2026-06-01

Spec: `docs/specs/053-language-agnostic-producers/`

Branch: `codex/053-language-agnostic-producers`

Reviewed head before fixes: `c8b05149888b5c8cc774d7c55735c30fbc6d64d3`

## Review Lanes

| Lane | Model | Result | Counted |
| --- | --- | --- | --- |
| Local repo-grounded | Codex local inspection | stacked branch risk and overclaiming risk identified | yes |
| Kimi | `kimi-coding/kimi-for-coding` | `pass_with_changes` with two critical findings | yes |
| GLM | `zai/glm-5.1` | `pass_with_changes` with one critical and three major findings | yes |
| MiMo | `openrouter/xiaomi/mimo-v2.5-pro` | `pass_with_changes` with two major findings | yes |

All model lanes produced usable no-tools review output. No empty, hung,
malformed, stale, or off-topic lane was counted.

## Accepted And Fixed

| Finding | Source lanes | Disposition |
| --- | --- | --- |
| Candidate tool names can be overread as verified support. | Kimi, MiMo | Accepted. `candidate_tools` are now required to be objects with `verification_state` and `support_state`; plain strings are invalid. Tasks now require validation rejecting plain string candidate lists and support claims without local evidence. |
| Stacked implementation risk is unmanaged while PR #29 is open. | Kimi, GLM, MiMo | Accepted. `spec.md`, `plan.md`, `tasks.md`, and this disposition now state implementation must wait until PR #29 merges and 053 is rebased onto the merge commit unless the user explicitly accepts a stacked implementation branch. |
| Runtime topology and native language semantic guardrails lack enforcement. | Kimi, GLM | Accepted. Contract/tasks now require allow-listed schema validation and tests rejecting undeclared runtime-topology/native-language-semantics fields. |
| Weak-state transition rules are underspecified. | Kimi, GLM, MiMo | Accepted. Contract now defines state transition rules and tasks now require a weak-state fixture proving recommendations do not upgrade evidence. |
| Coverage scope is ambiguous for mixed-language repositories. | Kimi, GLM, MiMo | Accepted. Contract/data model now include `scope_detail` and `languages_in_scope`; tasks require a mixed-language partial coverage fixture. |
| Evaluation records risk becoming scanner orchestration. | GLM | Accepted. Spec, contract, data model, quickstart, and tasks now say Portolan validates and surfaces operator/external evaluation records but does not score, rank, probe, install, or run candidate producer tools in this slice. |
| Evaluation decision/status vocabulary needs control. | GLM, MiMo | Accepted. Contract continues to use `accepted`, `narrowed`, `rejected`, `blocked`, and `not_assessed`; tasks require schema validation for these values. |
| `status` and `evidence_state` distinction is unclear. | MiMo | Accepted. Contract now defines field semantics. |
| Need machine-readable schema. | MiMo | Accepted. T005 now names `schema/producer-family.schema.json` or equivalent allow-listed validation. |

## Rejected Or Narrowed

| Finding | Source lanes | Disposition |
| --- | --- | --- |
| Add `runtime_derived: boolean`. | Kimi | Narrowed. Instead of adding a special-case boolean now, this slice will use allow-listed record schemas and explicit rejection of undeclared runtime-topology fields. Runtime-specific fields can be added later when runtime-visible producer output is implemented. |
| Use `approved` as an evaluation decision. | MiMo | Rejected in favor of existing Portolan wording: `accepted`, `narrowed`, `rejected`, `blocked`, `not_assessed`. |
| Implement foundational contract and fixtures before PR #29 merges if time pressure exists. | MiMo | Deferred. Current branch policy is stricter: no implementation until PR #29 merges and this branch is rebased, unless the user explicitly accepts a stacked implementation branch. |

## Branch Policy

Current state:

- PR #29/spec 052 is open, non-draft, merge-clean, and checks pass.
- PR #29 has no GitHub review approval and no merge approval.
- 053 is stacked directly on PR #29 head.

Policy:

- Do not start implementation tasks for 053 until PR #29 merges and this branch
  is rebased onto the merge commit.
- If the user explicitly accepts stacked implementation, record that approval
  in a new review artifact before editing runtime code.
- Until then, allowed work is spec, review, contract planning, and non-runtime
  status cleanup only.

## Verdict

`pass_with_changes` for the spec direction. Accepted findings have been folded
into the spec, contract, data model, quickstart, and task ledger. The feature is
ready to wait at the implementation gate, not ready for implementation while PR
#29 remains unmerged.
