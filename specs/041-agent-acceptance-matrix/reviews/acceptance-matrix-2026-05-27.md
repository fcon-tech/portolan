# Acceptance Matrix And Ledger Template

Date: 2026-05-27
Spec: `specs/041-agent-acceptance-matrix/`
Contract: `docs/agent/ACCEPTANCE.md`

## Matrix Snapshot

This snapshot has been reconciled by later 2026-05-28 lane ledgers. Cursor UI
lanes are outside the current required acceptance scope, and Codex is treated as
a single-repo control lane rather than a requirement to repeat every target
shape.

| Cell ID | Harness | Target shape | State | Reason |
| --- | --- | --- | --- | --- |
| `codex-single-repo-control` | Codex | control / single-repo | `verified` | Ran locally with the blind prompt contract against the Portolan repository as a self-target; scoring is self-scored and independently reviewed only through slice review lanes; see `codex-single-repo-lane-2026-05-27.md`. |
| `cursor-agent-bigtop` | Cursor Agent CLI + Composer 2.5 | multi-repo | `verified` | Ran the blind Bigtop operator protocol locally against `/home/fall_out_bug/projects/bigtop-landscape`; produced context and map artifacts through the generic workflow and preserved weak evidence states. This is not UI Cursor evidence; see `specs/007-apache-bigtop-corpus/reviews/cursor-composer25-bigtop-lane-2026-05-27.md`. |
| `opencode-single-repo` | OpenCode + `kimi-for-coding/k2p6` | single-repo | `verified` | Ran locally with the blind prompt contract against the Portolan repository as a self-target using `kimi-for-coding/k2p6`; required OpenCode permission bypass for external output path; see `opencode-kimi-single-repo-lane-2026-05-27.md`. |
| `opencode-multi-repo` | OpenCode + `kimi-for-coding/k2p6` | multi-repo | `verified` | Ran locally with the blind prompt contract against `/home/fall_out_bug/projects/bigtop-landscape`; produced context and map artifacts through generic root discovery and preserved weak evidence states; see `opencode-k2p6-multi-repo-bigtop-lane-2026-05-27.md`. |
| `opencode-black-box` | OpenCode + `kimi-for-coding/k2p6` | black-box/metadata-heavy | `verified` | Ran locally with a black-box selection target; produced a map bundle with `metadata-visible`, `runtime-visible`, `claim-only`, `unknown`, and `not_assessed` evidence while refusing runtime-topology claims; see `opencode-k2p6-black-box-lane-2026-05-27.md`. |
| `opencode-install-prompt-self` | OpenCode + `kimi-for-coding/k2p6` | install prompt / single-repo | `verified` | See `opencode-k2p6-install-prompt-lane-2026-05-27.md`. |
| `opencode-ru-install-prompt-self` | OpenCode + `kimi-for-coding/k2p6` | Russian install prompt / single-repo | `verified` | See `opencode-k2p6-ru-install-prompt-lane-2026-05-27.md`. |
| `opencode-install-prompt-bigtop` | OpenCode + `kimi-for-coding/k2p6` | install prompt / multi-repo | `verified` | See `opencode-k2p6-install-prompt-bigtop-lane-2026-05-28.md`. |
| `opencode-install-prompt-external-single-repo` | OpenCode + `kimi-for-coding/k2p6` | install prompt / external single-repo | `verified` | See `opencode-k2p6-install-prompt-external-single-repo-lane-2026-05-28.md`. |
| `opencode-ru-install-prompt-external-single-repo` | OpenCode + `kimi-for-coding/k2p6` | Russian install prompt / external single-repo | `verified` | See `opencode-k2p6-ru-install-prompt-external-single-repo-lane-2026-05-28.md`. |
| `opencode-default-permission-external-output` | OpenCode + `kimi-for-coding/k2p6` | install prompt / external output permissions | `failed` | See `opencode-k2p6-default-permission-external-output-lane-2026-05-28.md`. |
| `opencode-default-permission-internal-output` | OpenCode + `kimi-for-coding/k2p6` | install prompt / repo-local output permissions | `verified` | See `opencode-k2p6-default-permission-internal-output-lane-2026-05-28.md`. |

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
