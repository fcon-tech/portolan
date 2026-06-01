# PI Slice Review Disposition

Date: 2026-06-02
Branch: `codex/055-runtime-topology-evidence`

## Review Lanes

| Lane | Status | Output |
| --- | --- | --- |
| `openrouter/moonshotai/kimi-k2.6` | assessed | `pi-kimi-review-2026-06-02.md` |
| `zai/glm-5.1` | assessed | `pi-glm-review-2026-06-02.md` |
| `openrouter/deepseek/deepseek-v4-pro` | assessed | `pi-deepseek-review-2026-06-02.md` |

All lanes ran sequentially with `--no-tools --no-context-files --no-session`
against a bounded review packet.

## Accepted Findings

| Finding | Source lanes | Disposition |
| --- | --- | --- |
| `runtimeReadErrorState` returned the same state in all branches and made the code misleading. | Kimi, GLM, DeepSeek | Fixed by inlining `graph.CannotVerify` for read failures and keeping only the reason helper. |
| Runtime subject IDs could collapse unusual labels whose sanitized ID became `unknown`. | GLM | Fixed by appending a short stable FNV hash for the `unknown` fallback path. |
| Top-level runtime path lacked tests for unsupported schema version, read failure, and complete coverage without unknown topology. | Kimi, GLM, DeepSeek | Fixed with focused maprun tests. |
| `unsafeRuntimeSource` should reject non-`://` URI schemes such as `data:` and `javascript:`. | Kimi | Fixed and covered by tests. |
| Partial/unknown top-level runtime coverage emits a new wrapper edge shape that should be documented. | DeepSeek | Fixed in `docs/runtime-observations.md`. |

## Rejected or Deferred Findings

| Finding | Disposition |
| --- | --- |
| Require `schema_version` in runtime observation files. | Rejected for this slice. The existing runtime observation contract documents `schema_version` as recommended and black-box runtime compatibility already accepts an omitted version. Unsupported non-empty versions still become `cannot_verify`. |
| Add exhaustive secret scanning/redaction for all runtime payload fields. | Deferred. This slice rejects obvious unsafe source labels and documents that producers must redact; full secret scanning is outside the approved local import scope. |
| Refactor top-level and black-box runtime parsers into a shared package. | Deferred. The current change is intentionally small and reversible; extract a shared parser only if duplication grows in a later slice. |

## Verification After Fixes

Focused verification:

```bash
gofmt -w internal/maprun/maprun.go internal/maprun/maprun_test.go
go test -count=1 ./internal/maprun
```

Result: verified.
