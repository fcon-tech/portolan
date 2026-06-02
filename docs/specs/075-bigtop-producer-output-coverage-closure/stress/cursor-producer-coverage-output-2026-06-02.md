**Mode:** REVIEW (Ask) — classification from your prompt facts only; aligned with spec 075’s producer matrix.

---

## 1. Verified producer-output claims (beyond Syft/CycloneDX)

| Family | Status | What is verified |
|--------|--------|------------------|
| **Docker Compose deployment model** | `verified` | Compose v5.1.4 `config` for the Bigtop Docker provisioner: one service, one network, privileged mode, memory/mount metadata (desired-state model). |
| **Semgrep local API/catalog mentions** | `verified` (bounded) | Semgrep 1.164.0: 102 provisioner/Puppet files, 143 findings, 0 errors — mention/catalog evidence only. |
| **jscpd duplication** | `verified` (bounded) | Bounded Bigtop test/framework clone report JSON exists and validates. |
| **Protobuf API/catalog** | `verified` on bounded surfaces | `protoc` descriptors for Hadoop HDFS/common, YARN API/common, HBase REST, plus earlier Alluxio protos; spec 066 scale: 76 files, 957 messages, 61 enums, 38 services, 325 methods. |
| **Helm deployment/catalog** | `verified` on bounded static outputs | Helm v3.19.4: Airflow chart (43 K8s resources, 11 workloads, 8 Services) + four Alluxio chart templates — static desired state. |
| **Universal Ctags (Java/Go)** | `verified` as reference-role evidence | 873,435 imported reference-role records / 59,704 files / 15 roots — source-visible roles, not a graph. |
| **Universal Ctags (C/C++/Python/Sh)** | `verified` as reference-role evidence | 147,472 reference-role records / 8,432 files. |
| **`jdeps` on existing artifacts** | `verified` (narrow) | 289 package dependency rows over 9 `.jar`/`.class` artifacts (with 16 `not found` rows). |

**Not in this list:** Syft/CycloneDX (out of scope per question). **gopls** is not fully verified (see §2).

---

## 2. Partial claims only

| Family | Why `partial` |
|--------|----------------|
| **Protobuf API/catalog** | Bounded Hadoop/YARN/HBase/Alluxio surfaces only; not whole-Bigtop API catalog. |
| **Helm deployment/catalog** | Static rendered manifests; not live cluster state or pod readiness. |
| **Universal Ctags (both language groups)** | Reference-role / import-role records only — not def/use, not resolved cross-refs, not call graph. |
| **`jdeps`** | Nine small/test/fixture artifacts; not production Bigtop JVM dependency closure. |
| **gopls** | Symbol listings for 5 Airflow Go SDK files only. |
| **Runtime (spec 073)** | One container, one network, Docker inspect, one running YARN NodeManager — plus explicit failures/skips for other daemons. |

**C1–C9 rubric (from matrix):** C3 is verified only as **bounded metadata-visible** deployment models; C4, C5, C6, C7 remain **partial** at best for architecture parity.

---

## 3. Blocked, `cannot_verify`, or `not_assessed`

| Claim | Status |
|-------|--------|
| **Whole-Hadoop protobuf descriptors** | `blocked` / `cannot_verify` |
| **HBase shaded protobuf descriptors** | `blocked` / `cannot_verify` |
| **Complete Bigtop runtime topology** | `cannot_verify` (073 is partial; key daemons failed or were skipped) |
| **Healthy end-to-end Hadoop/YARN stack** | `failed` / `partial` for topology intent (NameNode, ResourceManager, HistoryServer, ProxyServer failed; Datanode skipped/not found) |
| **Spec 074 runtime health summary** | `blocked` / `not_assessed` (pending explicit approval; no executed output in prompt) |
| **Full symbol/reference graph** | `cannot_verify` |
| **Call graph** | `cannot_verify` |
| **C9 human / enterprise code-intelligence parity** | `cannot_verify` (needs spec 076 and stronger C4/C6 or reviewed exclusions) |

---

## 4. Does this matrix prove complete runtime topology?

**No — `cannot_verify` for complete topology.**

Evidence is mixed:

- **Verified/partial runtime-visible:** one Bigtop container, one network, Docker inspect, one running NodeManager (spec 073).
- **Failed/skipped:** NameNode, ResourceManager, HistoryServer, ProxyServer; Datanode skipped/not found.
- **Not assessed:** spec 074 health summary.
- **Static models (Compose/Helm) are not runtime** — they are desired-state / metadata-visible only.

---

## 5. Does this matrix prove a full symbol/reference or call graph?

**No — `cannot_verify` for full graph; `partial` at best for bounded slices.**

- Ctags: large **reference-role** corpora (source-visible), explicitly **not** resolved def/use or call graph.
- gopls: **partial** symbol inventory for five Go files.
- jdeps: **narrow** compiled-artifact package rows, not source-level or full-JVM graph.
- Protobuf/Semgrep: API/catalog **mentions** and descriptors, not executable call edges.

---

## 6. Can we say “Cursor plus Portolan understands Bigtop like a human or enterprise code intelligence system”?

**No — `cannot_verify` (C9).**

The matrix shows **multiple bounded, producer-run evidence families** suitable for agent-assisted triage and gap-aware reasoning. It does **not** support human-parity or enterprise code-intelligence parity: incomplete runtime, no call graph, no full reference graph, blocked protobuf surfaces, and approval-gated health capture.

---

## 7. Allowed vs disallowed wording

### Allowed (grounded in verified/partial evidence)

- “Portolan has **verified, bounded** producer outputs beyond Syft/CycloneDX for Bigtop: Docker Compose desired-state, Helm static manifests (Airflow + Alluxio), protobuf descriptors on selected Hadoop/YARN/HBase/Alluxio surfaces, Semgrep local-rule findings on 102 provisioner/Puppet files, Universal Ctags **reference-role** records at stated scale, narrow `jdeps` rows on nine existing artifacts, a validating **bounded** jscpd clone report, and **partial** runtime-visible evidence (one container, one network, one NodeManager) from spec 073.”
- “Compose and Helm outputs are **metadata-visible deployment/catalog models**, not live topology.”
- “Ctags outputs are **source-visible reference-role evidence**, not a resolved graph or call graph.”
- “Runtime evidence is **partial**; several expected daemons **failed** or were **not found**; spec 074 health is **not_assessed** pending approval.”
- “Gaps for whole-Hadoop/HBase-shaded protos and complete runtime topology are **explicitly blocked or cannot_verify**.”

### Disallowed (overclaims)

- “Portolan **verifies complete** Bigtop runtime topology.”
- “Portolan has a **full** Bigtop symbol, reference, or **call** graph.”
- “Static Compose/Helm models **prove** what is running in production/Kubernetes.”
- “Semgrep findings **are** the API catalog” (they are **mentions**, not semantic API closure).
- “873k+ Ctags records **mean** we understand dependencies/calls across Bigtop.”
- “Cursor + Portolan **understands Bigtop like a human**” or “**like** Sonar/Sourcegraph/enterprise code intelligence.”
- “Protobuf descriptors **cover** all Bigtop APIs” (whole-Hadoop / shaded HBase remain **blocked/cannot_verify**).
- “One NodeManager **proves** a healthy Hadoop/YARN cluster.”

### Neutral status labels (use consistently)

| Label | Use when |
|-------|----------|
| `verified` | Producer ran; artifact exists; scope matches claim; boundary stated. |
| `partial` | Real evidence, intentionally incomplete scope or semantics. |
| `failed` | Producer/run attempted; required component evidence missing (e.g. daemons). |
| `blocked` | External gate (approval, tooling, scope) prevents run. |
| `cannot_verify` | Claim exceeds available evidence (full topology, full graph, C9 parity). |
| `not_assessed` | No run/output yet (spec 074 in prompt). |

---

**Decision gate (concise):** The matrix **closes producer-output inventory and claim boundaries** for specs 054–075; it **does not** close architecture parity (C4 complete topology, C6 full graph, C9 human/enterprise parity). Treat every family with its evidence state (`metadata-visible`, `source-visible`, `runtime-visible`) and the stated limitation in the same sentence as the success claim.

If you want this turned into a formal stress-test disposition file under `docs/specs/075-.../stress/`, switch to Agent mode and ask for that write-up.
