# Plan And Task Review Disposition

Date: 2026-06-09

Spec: `docs/specs/087-bigtop-brownfield-preflight/`

Branch: `codex/087-bigtop-brownfield-preflight`

## Review Lanes

- `zai-coding-plan/glm-5.1`: failed, `unknown certificate verification error`;
  not counted as assessed review evidence.
- `minimax-coding-plan/MiniMax-M3`: blocked, opencode provider not found.
  `openrouter/minimax/minimax-m3` exists but was not in the user-provided
  allowlist, so it was not substituted.
- `kimi-for-coding/k2p6`: assessed, code/plan review.
- `openrouter/deepseek/deepseek-v4-pro`: assessed, requirements review.
- `openrouter/qwen/qwen3.7-plus`: assessed, security/trust-boundary review.

## Accepted Findings And Fixes

- Kimi F2: US4 negative evidence test was too broad. Fixed T023 to assert
  recommendations are emitted only in preflight artifacts and are not written as
  findings, graph facts, or imported evidence.
- Kimi F3: artifact discovery was undefined. Added non-recursive discovery
  contract, known filenames, missing/malformed behavior, and tasks for
  discovery/error handling.
- Kimi F4: overlapping tests. Split helper/data-model tests from CLI/output
  integration tests.
- Kimi F5: missing error-path coverage. Added T009 for missing root, unreadable
  or empty artifacts, malformed JSON/JSONL, unsafe output, and write failures.
- DeepSeek F-001: JSON Schema validation conflicted with standard-library-only
  implementation. Fixed research/contracts/tasks to make schema a contract and
  use explicit Go validation for runtime checks.
- DeepSeek F-002: SC-003 asserted untestable agent behavior. Rescoped SC-003 to
  structural handoff sections testable by focused tests; behavioral validation
  remains P7-091.
- DeepSeek F-003/F-004: task ledger and backlog status were stale after plan
  creation. Marked T001-T004 complete and updated P7-087 backlog status.
- DeepSeek F-005: absent/empty artifact directory was not specified. Added edge
  case, contract behavior, and error/gap tasks.
- Qwen SEC-001: target-derived strings can become prompt injection in handoff
  Markdown. Added FR-011, data-model validation rules, plan risk, and US3 tests
  for escaping/bounded rendering.
- Qwen SEC-002: secret handling was underspecified. Added FR-012 and data-model
  rules to avoid raw snippets, prompt text, credentials, or secret-like values.
- Qwen SEC-003: path traversal/write boundary was underspecified. Added FR-013
  and contract path/write-boundary rules.

## Rejected Findings

- Kimi F1: replace opencode with pi. Rejected. The current user request
  explicitly requires opencode review and provides an opencode model allowlist.
  This supersedes the older repo-local pi default for this session. The review
  remains opencode-only and merge approval remains `not_assessed`.

## Remaining Gaps

- `zai-coding-plan/glm-5.1`: not_assessed due certificate failure.
- `minimax-coding-plan/MiniMax-M3`: not_assessed because provider is not
  available in current opencode.
- Implementation is not yet verified; only plan/task readiness is assessed.
- PR review and GitHub checks are not_assessed.
- Merge approval is not_assessed.

## Verdict

`plan_task_review`: pass after accepted fixes

`ready_for_implementation`: verified for task-ledger execution

`merge_approval`: not_assessed
