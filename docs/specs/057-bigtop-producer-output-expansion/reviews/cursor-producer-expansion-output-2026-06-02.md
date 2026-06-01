Evaluation uses **only** the Spec 057 producer-run ledger. Evidence states and boundaries are preserved as stated.

## 1. New verified producer outputs (beyond Syft/CycloneDX)

| Producer-run ID | Family | Tool | Evidence state |
| --- | --- | --- | --- |
| `producer-run-alluxio-all-protos-20260602` | API/catalog | `protoc` | metadata-visible |
| `producer-run-alluxio-helm-chart-alluxio-20260602` | deployment-model | `helm` | metadata-visible |
| `producer-run-alluxio-helm-chart-monitor-20260602` | deployment-model | `helm` | metadata-visible |
| `producer-run-alluxio-operator-chart-alluxio-20260602` | deployment-model | `helm` | metadata-visible |
| `producer-run-alluxio-operator-chart-pillars-20260602` | deployment-model | `helm` | metadata-visible |
| `producer-run-bigtop-jscpd-tests-20260602` | duplication | `jscpd` | metadata-visible |

**Partial (not fully verified as a complete producer outcome):**

| Producer-run ID | Family | Tool | Evidence state |
| --- | --- | --- | --- |
| `producer-run-airflow-go-sdk-gopls-symbols-20260602` | symbol-index | `gopls` | metadata-visible (bounded; partial status) |

---

## 2–4. Claims table (`claim`, `status`, `evidence`, `boundary`)

| claim | status | evidence | boundary |
| --- | --- | --- | --- |
| Alluxio core transport exposes a **bounded** protobuf/RPC message surface (27 files under `repos/alluxio/core/transport/src/main/proto`) | **verified** (metadata-visible) | `producer-run-alluxio-all-protos-20260602` → `tool-outputs/alluxio-all-protos.descriptor.pb`, `alluxio-proto-files.txt` | Static descriptor set only; **not** runtime call paths; **not** full Bigtop or full Alluxio API/catalog coverage |
| Alluxio Kubernetes **deployment-model artifacts** exist for the main `alluxio` Helm chart | **verified** (metadata-visible) | `producer-run-alluxio-helm-chart-alluxio-20260602` → rendered `helm-template.yaml` | Static rendered template; **not** runtime topology or live cluster state |
| Alluxio has a **monitoring** Helm chart template in-repo | **verified** (metadata-visible) | `producer-run-alluxio-helm-chart-monitor-20260602` | Static template only; **not** runtime observability topology |
| Alluxio operator packaging includes a **repo/alluxio** chart template | **verified** (metadata-visible) | `producer-run-alluxio-operator-chart-alluxio-20260602` | Static template only; **not** operator runtime behavior |
| Alluxio operator includes a **pillars** chart template | **verified** (metadata-visible) | `producer-run-alluxio-operator-chart-pillars-20260602` | Static template only; **not** runtime topology |
| Bigtop test/framework trees show **clone duplication** in a bounded scope | **verified** (metadata-visible) | `producer-run-bigtop-jscpd-tests-20260602` → `jscpd-report.json` for `bigtop-tests` + `bigtop-test-framework` | Duplication report only; **not** service architecture, dependencies, or runtime layout |
| Selected **Airflow Go SDK** files have extractable symbols | **partial** (metadata-visible) | `producer-run-airflow-go-sdk-gopls-symbols-20260602` → `gopls-airflow-go-sdk-selected-symbols.txt`, `...-status.tsv` (5 files) | File-symbol listing only; **not** cross-reference graph; **not** full Bigtop symbol coverage |
| Alluxio **alluxio-job** operator chart renders cleanly | **blocked** (`cannot_verify`) | `producer-run-alluxio-operator-chart-alluxio-job-20260602` — `helm template` nil pointer at `alluxio-job/templates/job.yaml:51:27`; stderr in `...alluxio-job.helm-template.stderr` | Chart template **not** verified; no positive deployment-model claim for this chart |
| Bigtop repo-wide **semgrep auto** static analysis completed | **blocked** (`cannot_verify`) | `producer-run-bigtop-semgrep-auto-20260602` — auto config requires metrics or explicit local config; metrics off | No security/static-analysis findings ledger for Bigtop from this run |
| **Bigtop runtime topology** (processes, live services, actual deployment graph) | **not_assessed** | `producer-run-bigtop-runtime-20260602` — no runtime export; `selection.json` `runtime: null`; `docker ps` containers unrelated to Bigtop | **Does not prove** runtime topology; unrelated Docker is out of scope |
| **Full Bigtop symbol/reference graph** (ctags/LSIF/global-scale) | **not_assessed** | `producer-run-bigtop-full-symbol-reference-20260602` — no full producer installed; only bounded gopls above | **Does not prove** enterprise-style symbol/reference coverage for Bigtop |
| **Enterprise code-intelligence parity** (full catalog, full symbols, runtime + static unified) | **not_assessed** / **not supported** | Combination of bounded Alluxio protos, 4 verified + 1 blocked Helm runs, partial gopls, blocked semgrep, absent runtime | Parity **not** established; expansion is material but intentionally scoped |

---

## Direct answers

**1. Verified beyond Syft/CycloneDX:** six **verified** runs (Alluxio protos, four Helm templates, Bigtop jscpd) plus one **partial** run (bounded Airflow Go SDK `gopls`).

**2. Scoped architecture claims they support:** bounded Alluxio **message/API surface** (proto tree only), **in-repo K8s/Helm deployment-model intent** for four Alluxio chart paths, **test/framework duplication** in Bigtop test trees, and **local symbol names** for five Airflow Go SDK files—not live topology, not cross-repo reference graph, not full Bigtop catalog.

**3. Partial / blocked / not_assessed:** partial — `producer-run-airflow-go-sdk-gopls-symbols-20260602`; blocked — `producer-run-alluxio-operator-chart-alluxio-job-20260602`, `producer-run-bigtop-semgrep-auto-20260602`; not_assessed — `producer-run-bigtop-runtime-20260602`, `producer-run-bigtop-full-symbol-reference-20260602`.

**4. Runtime topology or enterprise parity?** **No.** Runtime is `not_assessed` with `runtime: null`; Helm/proto/jscpd/gopls are **metadata-visible** static or bounded artifacts; full symbol/reference and semgrep are missing or blocked. This run **expands** producer evidence beyond SBOM tools but **does not** prove Bigtop runtime topology or enterprise code-intelligence parity.
