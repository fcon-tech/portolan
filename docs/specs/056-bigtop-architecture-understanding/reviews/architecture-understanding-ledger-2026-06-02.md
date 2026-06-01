# Architecture Understanding Acceptance Ledger

Date: 2026-06-02
Branch: `codex/056-bigtop-architecture-understanding`
Model: Cursor Agent `composer-2.5`

## Lane Evidence

| Lane | Status | Evidence |
| --- | --- | --- |
| Cursor-only full workspace attempt 1 | not_assessed | Malformed packet contained literal `$(cat ...)`; stopped and excluded. |
| Cursor-only full workspace attempt 2 | not_assessed | Hung during broad workspace scan; stopped and excluded. |
| Cursor-only bounded source packet | assessed | `stress/cursor-only-bounded-prompt-2026-06-02.md`, `stress/cursor-only-bounded-output-2026-06-02.md` |
| Cursor-plus-Portolan bounded packet | assessed | `stress/cursor-plus-portolan-prompt-2026-06-02.md`, `stress/cursor-plus-portolan-output-2026-06-02.md` |

The bounded baseline is weaker than unrestricted Cursor workspace exploration,
but it is usable for comparing the same question set with and without Portolan
evidence.

## Scored Questions

| Question | Evidence families | Cursor-only status | Cursor-plus-Portolan status | Delta | Final claim status | Supporting evidence | Remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q1 | source/inventory, corpus boundary | verified scoped | verified scoped | Improved evidence discipline: Portolan adds 18-repo corpus count and external-completeness `unknown`. | partial (`metadata-visible`) | Cursor-only output Q1; Cursor+Portolan output Q1; map summary coverage records. | The hub role is README-level/source-visible evidence for `apache-bigtop-repo`, not structural proof for the whole corpus; completeness outside selected corpus remains unknown. |
| Q2 | source/inventory, deployment/model, observability/model | partial | partial | Improved coverage: Portolan adds `producer-run-bigtop-compose-20260601` for Bigtop declared deployment config and `producer-run-alluxio-helm-monitor-20260601` for bounded Alluxio monitoring adjunct model. | partial | Cursor+Portolan output Q2; producer-run ledger. | Other selected repos are not classified as packaging surfaces. Alluxio monitor is observability/instrumentation, not Alluxio core deployment topology. |
| Q3 | deployment/model producer-run | partial | partial | Improved evidence discipline: Portolan grounds Compose claim in rendered producer-run and explicit `metadata-visible` limitation. | partial | Cursor+Portolan output Q3; `producer-run-bigtop-compose-20260601`. | Runtime inside the container remains not_assessed. |
| Q4 | deployment/model producer-run | partial | partial | Improved evidence discipline: Portolan adds rendered Helm kind list and bounded chart scope. | partial | Cursor+Portolan output Q4; `producer-run-alluxio-helm-monitor-20260601`. | Alluxio core K8s/runtime architecture remains not_assessed. |
| Q5 | API/catalog producer-run | partial | partial | Improved evidence discipline: Portolan adds descriptor producer-run and covered proto units. | partial | Cursor+Portolan output Q5; `producer-run-alluxio-grpc-descriptor-20260601`. | Full Bigtop/API catalog and runtime call graph remain not_assessed. |
| Q6 | runtime-visible evidence | blocked/not_assessed | blocked/not_assessed | Improved gap attribution: Portolan names runtime producer-run and gap records. | blocked/not_assessed | `producer-run-bigtop-runtime-not-assessed-20260601`; `gap-runtime-observation-not-assessed`. | No safe local Bigtop runtime observation export is selected. |
| Q7 | symbol/reference producer output | not_assessed | not_assessed | Improved gap attribution: Portolan names symbol-index producer-run and gap records. | not_assessed | `producer-run-bigtop-symbol-index-not-assessed-20260601`; `gap-symbol-index-not-assessed`. | No symbol/reference producer output is selected. |
| Q8 | paired Cursor lanes and scoring ledger | not_assessed | partial | Confirmed for this bounded comparison after ledger review: Portolan improved evidence discipline or gap attribution on Q1-Q7, at least five questions. | partial | This ledger, both bounded Cursor outputs, and independent review disposition. | Full unrestricted Cursor comparison remains not_assessed because full-workspace Cursor-only hung; this is not a full-workspace architecture-understanding proof. |
| Q9 | acceptance ledger and claim boundary | not_assessed | partial | Improved claim boundary: Portolan lane states safe scoped claims and explicit non-claims. | partial | Cursor+Portolan output Q9; this ledger. | Public/product wording can only claim scoped evidence discipline, not enterprise parity. |

## Acceptance Result

Verified:

- No broad Bigtop architecture-understanding claim is verified by this slice.

Confirmed for the bounded comparison:

- Portolan improves evidence discipline or gap attribution on at least five
  questions by adding producer-run IDs, evidence states, bounded scopes, and
  explicit gap records.

Partial:

- Q1: README-level/source-visible role classification for `apache-bigtop-repo`
  as Bigtop packaging/deployment/interoperability-testing hub.
- Q2-Q5: deployment/model and API/catalog claims are bounded to specific
  producer-run scopes and remain `metadata-visible`.
- Q8-Q9: comparison and safe claim wording are useful for this bounded packet,
  but not proof of complete architecture understanding.

Blocked/not_assessed:

- Bigtop runtime topology: no `runtime-visible` Bigtop observation export.
- Bigtop symbol/reference relationships: no symbol-index producer output.
- Full Bigtop API/catalog/model/runtime coverage: partial or not_assessed.
- Human/enterprise code-intelligence parity: not verified.

## Product Claim Boundary

Allowed wording after this slice:

> In a bounded Cursor Composer 2.5 comparison on Apache Bigtop, Portolan improved
> evidence discipline by attaching producer-run IDs, evidence states, coverage
> gaps, and explicit non-claims to architecture answers. It supports
> source-visible, README-level role classification for `apache-bigtop-repo`,
> metadata-visible claims about the Bigtop Docker Compose declared configuration
> model, metadata-visible claims about the Alluxio monitor Helm declared
> observability template, and metadata-visible bounded Alluxio gRPC descriptor
> evidence.

Disallowed wording:

> Portolan understands Bigtop architecture like a human or enterprise code
> intelligence.

> Portolan verifies Bigtop runtime topology.

> Portolan has full symbol/API/catalog/model/runtime coverage for Bigtop.
