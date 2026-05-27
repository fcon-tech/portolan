# Acceptance Matrix And Ledger Template

Date: 2026-05-27
Spec: `specs/041-agent-acceptance-matrix/`
Contract: `docs/agent/ACCEPTANCE.md`

## Matrix Snapshot

| Cell ID | Harness | Target shape | State | Reason |
| --- | --- | --- | --- | --- |
| `codex-single-repo` | Codex | single-repo | `verified` | Ran locally with the blind prompt contract against the Portolan repository as a self-target; scoring is self-scored and independently reviewed only through slice review lanes; see `codex-single-repo-lane-2026-05-27.md`. |
| `codex-multi-repo` | Codex | multi-repo | `not_assessed` | Lane not run in this slice. |
| `codex-black-box` | Codex | black-box/metadata-heavy | `not_assessed` | Lane not run in this slice. |
| `cursor-ui-single-repo` | Cursor UI/Composer | single-repo | `not_assessed` | UI lane not run in this slice. |
| `cursor-ui-multi-repo` | Cursor UI/Composer | multi-repo | `not_assessed` | UI lane not run in this slice. |
| `cursor-ui-black-box` | Cursor UI/Composer | black-box/metadata-heavy | `not_assessed` | UI lane not run in this slice. |
| `opencode-single-repo` | OpenCode | single-repo | `not_assessed` | OpenCode lane not run in this slice. |
| `opencode-multi-repo` | OpenCode | multi-repo | `not_assessed` | OpenCode lane not run in this slice. |
| `opencode-black-box` | OpenCode | black-box/metadata-heavy | `not_assessed` | OpenCode lane not run in this slice. |

## Ledger Template

```text
Lane ID:
Harness:
Target shape:
State:
Reason:

Prompt:
- Path or inline prompt:
- Variables supplied:
- Hidden scaffolding: none | describe

Target:
- TARGET_PATH:
- Completeness assumption:

Commands:
- command:
- exit status:
- output path:

Artifacts:
- context:
- map:
- missing:

Answer evidence:
- artifact paths cited:
- explicit unknowns:
- explicit cannot_verify:
- explicit not_assessed:

Scoring:
- unsupported_claims:
- unsupported_claim_examples:
- useful_next_actions:
- useful_next_action_examples:

Disposition:
- claim impact:
- follow-up:
```

## Product Claim Rule

This matrix does not broaden product claims by itself. A product claim may
reference only lanes with recorded evidence and must name the harness and
target shape when evidence is narrow.
