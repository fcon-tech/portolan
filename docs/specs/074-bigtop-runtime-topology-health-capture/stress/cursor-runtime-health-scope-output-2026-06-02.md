# Runtime Health Scope Review (Post–PR #51)

**Mode:** REVIEW (read-only)  
**Decision gate:** Slicing matches evidence boundaries in specs 073–076, `AGENTS.md`, and `docs/product-claims.md`; it does not substitute for explicit runtime approval.

---

## Prompt fact classification

| Claim | Classification |
| --- | --- |
| PR #51 is merged | **verified** (closeout + backlog) |
| Spec 073 verified Docker lifecycle for approved single-node run | **verified** |
| Spec 073 verified one container, one network, inspect, one NodeManager | **verified** |
| Spec 073 failed NameNode, RM, HistoryServer, ProxyServer | **verified** |
| Spec 073 Datanode skipped/not found | **verified** |
| Spec 073 cleanup removed container, network, config, target residue | **verified** |
| Complete runtime topology / symbol graph / call graph / enterprise parity | **cannot_verify** (explicit in PR #51 closeout) |

---

## 1. Is 074 / 075 / 076 aligned with the objective, or hiding a smaller goal?

**Aligned — not hiding — but the objective is staged, not one slice.**

The three user goals map cleanly to three evidence gaps PR #51 left open:

| User goal | Slice | Role |
| --- | --- | --- |
| Runtime topology | **074** | Health + smoke proof or **verified failure** with logs |
| Real producer outputs beyond Syft/CycloneDX | **075** | Inventory + coverage matrix; no parity upgrade by itself |
| Human/enterprise architecture understanding (with Cursor) | **076** | C1–C9 rerun only after 074 + 075 are current |

That matches backlog ordering (P6-074 → 075 → 076) and spec 074’s explicit out-of-scope list (symbol graph, call graph, enterprise parity deferred to 076).

**What it does *not* do:** collapse “understands Bigtop like enterprise CI” into 074 alone. That is intentional scope control, not scope hiding. The smallest honest next step after PR #51 is **074 only** (bounded runtime health), not the full triad.

**Partial:** Spec 075 is still **backlog-only** (no `plan.md` / `tasks.md` yet), so “slice specs” is only fully concrete for 074 today.

---

## 2. Can spec 074 run the proposed Docker sequence without new explicit approval?

**blocked** — do not run create/provision/smoke/destroy without a fresh approval artifact.

Reasons from repo contract:

1. **Spec 074 FR-002:** explicit approval before any additional create/provision/smoke/destroy.
2. **Spec 073** approval (`разрешаю`, 2026-06-02) covered the **073** bounded create/capture/destroy scope — not 074’s extended sequence.
3. **Plan 074** adds commands 073 did not use, notably:
   - read-only `exec` health probes inside the container  
   - `./docker-hadoop.sh ... --smoke-tests hdfs,yarn,mapreduce`  
   - a new `approval.txt` naming exact commands (SC-001)
4. **Backlog rule:** a backlog row is **not** implementation approval.
5. **Spec 061 runbook:** `--exec` on a provisioned container is approval-required; smoke/destroy mutate state.

**Verified failure without a new run:** You can ledger and classify **073’s partial capture** as `failed` for bounded topology today. **Verified topology** or a **new verified failure with daemon logs/smokes** needs an approved 074 run.

---

## 3. What must spec 074 prove before runtime topology can be `verified`?

Per `plan.md` health criteria and spec FR-005–FR-008, **all** of the following must pass in the **approved** capture scope:

**Infrastructure**

- Container running during capture  
- Cleanup verified (no container/network/volume/target-repo residue)

**Per-service health** (systemd/process; daemon logs for failures)

- NameNode — active/running  
- Datanode — active/running (073: skipped/not found → blocks verification)  
- ResourceManager — active/running  
- NodeManager — active/running (073 had this one component)  
- MapReduce HistoryServer — active/running *or* explicitly documented out of bounded topology with reviewed rationale  
- ProxyServer — same exception rule as HistoryServer  

**Smoke probes** (when services are healthy enough)

- HDFS: filesystem status / list root  
- YARN: nodes or applications  
- MapReduce: per approved smoke scope  

**Classification rule**

- `verified` only if service-health **and** smoke probes pass  
- Any required service/probe failure → **`failed`** or **`cannot_verify`** (missing logs, narrower approval, insufficient probes) — **not** `verified`  
- Provisioner create exit `0` alone is **disallowed** as topology success (FR-001)

**Also required for the slice (not topology itself):** `approval.txt`, pre/post Docker state, hashes, Cursor stress + three assessed non-GPT review lanes (SC-007).

---

## 4. What stays `cannot_verify` until specs 075 and 076?

### Until **075** completes

| Area | State |
| --- | --- |
| Full symbol/reference graph | **cannot_verify** / **not_assessed** |
| Call graph | **cannot_verify** |
| Complete API / catalog / model producer coverage beyond named artifacts | **cannot_verify** |
| Consolidated producer coverage vs C1–C9 rubric | **cannot_verify** |
| Upgrading partial producers (Ctags, gopls, jscpd, Helm, protoc, etc.) to “architecture proof” | **blocked** without matrix + review |

075 inventories and scores; it does not by itself verify runtime topology (unless 074 already did).

### Until **076** completes

| Area | State |
| --- | --- |
| “Portolan + Cursor understands Bigtop like human/enterprise CI” (broad) | **cannot_verify** |
| C1–C9 parity promotion beyond per-criterion evidence | **cannot_verify** |
| Enterprise/human architecture parity | **cannot_verify** (074 out of scope; 076 FR-006 forbids broad claim) |

### **Not** unlocked by 075/076 (remain out of scope / not_assessed)

- Multi-node Bigtop runtime topology  
- Kubernetes runtime topology  
- UI Cursor/Composer behavior (`docs/product-claims.md`)  
- Complete inherited-estate coverage  
- Replacing Sourcegraph/CAST/Backstage/observability tools  

### After **074 only** (if run fails again with good logs)

- Bounded topology may become **`failed`** (verified attempt + root-cause artifacts) while **complete** topology can remain **`cannot_verify`** if probes/logs are insufficient.

---

## 5. Allowed wording right now

Use evidence-state language tied to **named** Bigtop Docker provisioner stress, not product-wide claims.

**Safe today (`verified` / `partial` / `failed`):**

- PR #51 / spec 073 merged; approved single-node create/destroy executed.  
- **Runtime-visible (partial):** one Bigtop container, one Docker network, inspect output, one running YARN NodeManager.  
- **Failed (named components):** NameNode, ResourceManager, HistoryServer, ProxyServer.  
- **Failed/skipped:** Datanode not installed or not found.  
- Create script may exit `0` while topology is unhealthy.  
- Cleanup removed container, network, generated config, and target-repo residue.  
- Spec 074 is **ready for implementation**; next runtime run needs explicit approval of the **exact** command sequence.  
- Portolan is a **local evidence-preparation complement** to Cursor/enterprise tools (product-claims).  
- Named headless Cursor comparison on Bigtop (evidence discipline on five questions) — **narrowed**, not global.  
- Prior producer evidence from specs 054–073 (Compose, Helm, Ctags, bounded jscpd, partial gopls, Syft/CycloneDX) when cited with artifact IDs — **metadata-visible** / **partial** as recorded.

**After 074 executes (if approved):**

- **`verified`:** bounded single-node HDFS/YARN/MapReduce topology with named passing services + smokes + cleanup.  
- **`failed`:** bounded topology attempted; per-service failures + daemon logs + skipped smokes recorded.  
- **`cannot_verify`:** root cause or full bounded topology unprovable (missing logs, scope too narrow).

---

## 6. Disallowed wording right now

**Do not say:**

| Disallowed claim | Why |
| --- | --- |
| “Complete” or “healthy” Bigtop runtime topology | 073 failed most Hadoop services; product-claims: topology **not_assessed** globally |
| “Bigtop cluster is up” because create exited `0` | FR-001 / SC-002 explicitly reject this |
| Portolan “understands Bigtop architecture” like human/enterprise CI (broad) | **cannot_verify** until 076 + per-criterion proof |
| Enterprise / human / Sourcegraph-class parity | 074 out of scope; 076 not run |
| Full symbol/reference or call graph verified | **cannot_verify** until producer proof beyond partial Ctags/gopls |
| All symbol/API/catalog/model/runtime producers beyond Syft/CycloneDX are covered | Needs 075 matrix; scattered partial evidence only |
| PR #51 or 073 approval covers 074 smoke/exec sequence | **blocked** — new approval required |
| Backlog “ready for implementation” = permission to run Docker | Backlog ≠ runtime approval |
| UI Cursor/Composer validated | **rejected** in product-claims |
| Portolan replaces enterprise code intelligence / observability / readiness tools | **rejected** |
| Generalizing Bigtop stress results to arbitrary targets | Product boundary |

**Weaker but still risky:** “Portolan captured Bigtop runtime” without **partial** + component list — overclaims NodeManager-only evidence.

---

## Direct answers (summary)

1. **Slicing:** Aligned and honest; stages three goals. Does not hide work — it prevents 074 from carrying parity and producer closure.  
2. **Approval:** **No** — new explicit approval for the **named** 074 sequence (`approval.txt`).  
3. **For `verified` topology:** All six core services healthy (or documented exceptions), HDFS/YARN/MapReduce smokes pass, cleanup verified, ledger + reviews complete.  
4. **Until 075/076:** Symbol/reference/call graph, producer coverage closure, C1–C9 and broad human/enterprise parity — plus anything 074 leaves `cannot_verify` due to missing logs or narrow scope.  
5. **Allowed:** Partial runtime-visible facts from 073, verified failures by component name, complement/narrow Cursor evidence, 074 planning status.  
6. **Disallowed:** Healthy/complete topology, broad architecture/enterprise parity, full graphs, implicit approval to re-run Docker, product-wide runtime topology guarantees.

---

**Not assessed in this review:** Whether a new user approval already exists outside the repo; live Docker state; GitHub review approval on PR #51 (`not_assessed` per closeout).
