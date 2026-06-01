# PI Slice Review Disposition

Date: 2026-06-02
Branch: `codex/056-bigtop-architecture-understanding`

## Review Lanes

| Lane | Status | Output |
| --- | --- | --- |
| `openrouter/moonshotai/kimi-k2.6` | not_assessed | `pi-kimi-review-2026-06-02.md` |
| `zai/glm-5.1` | assessed | `pi-glm-review-2026-06-02.md` |
| `openrouter/deepseek/deepseek-v4-pro` | assessed | `pi-deepseek-review-2026-06-02.md` |
| `openrouter/xiaomi/mimo-v2.5-pro` | assessed replacement | `pi-mimo-review-2026-06-02.md` |

Kimi output was off-task for this packet: it fabricated tool-read activity and
made false claims about the repository lacking Go files and schema files. It is
retained as raw degraded output but does not count as assessed review evidence.
MiMo was run as the replacement third assessed lane.

## Accepted Findings

| Finding | Source lanes | Disposition |
| --- | --- | --- |
| Q1 `verified scoped` was too strong for README/source-visible evidence. | GLM, DeepSeek, MiMo | Fixed: final Q1 claim downgraded to `partial (metadata-visible)` with README-level/source-visible scope. |
| Q8 wording risked self-verification/circularity. | GLM, DeepSeek, MiMo | Fixed: Q8 now says "confirmed for this bounded comparison after ledger review" and cites independent review disposition. |
| Product claim boundary overbroadly implied the whole selected corpus was assessed. | DeepSeek | Fixed: allowed wording names `apache-bigtop-repo`, Bigtop Compose, Alluxio monitor Helm, and bounded Alluxio gRPC descriptor surfaces only. |
| Alluxio monitor Helm was too easily read as core deployment topology. | DeepSeek | Fixed: ledger and allowed wording classify it as a metadata-visible observability/instrumentation template. |
| Allowed wording needed explicit `metadata-visible`/static qualifiers. | DeepSeek | Fixed: allowed wording now carries source-visible or metadata-visible qualifiers and not-runtime scope. |

## Rejected or Deferred Findings

| Finding | Disposition |
| --- | --- |
| Require unrestricted full-workspace Cursor baseline before any bounded comparison result. | Rejected for this slice. Full-workspace attempts were malformed/hung and are recorded as `not_assessed`; the result is explicitly bounded and not a full architecture-understanding proof. |
| Check producer-run output binaries into spec 056. | Deferred. Spec 054 already owns those artifacts and producer-run ledger paths; 056 references them as existing external stress evidence rather than duplicating large outputs. |
| Add automated lint for disallowed product wording. | Deferred as follow-up. The current slice records allowed/disallowed wording and review disposition, but no CI rule is added. |

## Verification After Fixes

Verified:

```bash
go test -count=1 ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
