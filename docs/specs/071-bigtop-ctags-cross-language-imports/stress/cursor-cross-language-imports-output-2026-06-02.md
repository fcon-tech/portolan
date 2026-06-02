Run metadata:

- model: Cursor Agent `composer-2.5`
- branch: `codex/071-bigtop-ctags-cross-language-imports`
- execution_mode: `cursor-agent --print --mode ask --trust`
- editing: output captured from command; metadata block added after capture

**Mode:** DESIGN_REVIEW (read-only; rubric + spec 071 ledger + prior 070 assessment pattern)  
**Evidence basis:** Counts and boundaries you supplied; `docs/specs/058-bigtop-runtime-symbol-parity-proof/reviews/parity-rubric-2026-06-02.md`, spec 071 `spec.md` / `reviews/ctags-cross-language-ledger-2026-06-02.md`, spec 070 stress output

---

## 1. Does this improve C6 breadth beyond spec 070?

**Yes — a verified, bounded widening inside C6, still not full C6.**

| Layer | After 059 | After 070 | After 071 |
| --- | --- | --- | --- |
| Definitions | Broad ctags `def` | Same | Same (not re-run in 071) |
| Reference roles | None for C6 refs | Java/Go **package** `imported` (873,435 records, 59,704 files) | C/C++/Python/Sh **reference roles** (147,472 ref records, 8,432 files) |
| Languages for ref slice | — | Java, Go only | C, C++, Python, Sh |

071 closes the gap 070 left open: C/C++ `#include`-style header roles (`system`/`local`), Python `imported` / `namespace` / `indirectlyImported`, shell `loaded` (153). That is **real producer output** (`exit 0`, ledger-recorded), not a relabel of 059 definitions.

**Evidence state for the new slice:** `verified` for **bounded `source-visible` cross-language import/header/script reference roles** on the same 15-target scope.

C6 is no longer “definitions + Java/Go package imports only”; it is **definitions + Java/Go package imports + C/C++/Python/Sh ctags reference roles** — still all at **declaration/import/header/script** granularity, not symbol usage.

---

## 2. Is full C6 now verified or still partial?

**Still `partial`. Full C6 is not verified.**

Per the C1–C9 rubric, **verified C6** requires producer output with **definitions and references** for the declared scope — meaning a **symbol/reference graph**, not import/header/script roles alone:

```18:18:docs/specs/058-bigtop-runtime-symbol-parity-proof/reviews/parity-rubric-2026-06-02.md
| C6 | Symbol/reference graph | Producer output with definitions and references for declared selected scope | File-symbol listing for selected files | `rg` snippets or definitions-only lists represented as references |
```

071’s ledger matches that boundary:

```119:131:docs/specs/071-bigtop-ctags-cross-language-imports/reviews/ctags-cross-language-ledger-2026-06-02.md
partial:

- C6 symbol/reference graph. These are real source-visible reference roles, but
  they are not cross-resolved symbol references or call graph evidence.

cannot_verify:

- Full symbol/reference graph.
- Method/class reference edges.
- Cross-reference resolution.
- Call graph.
```

| Sub-claim | State after 071 |
| --- | --- |
| Broad symbol **definitions** (059) | `verified` bounded |
| Java/Go package **import** refs (070) | `verified` bounded |
| C/C++/Python/Sh **import/header/script** ref roles (071) | `verified` bounded |
| Method/class/type **references** | `cannot_verify` |
| **Cross-reference resolution** (def → uses) | `cannot_verify` |
| **Call graph** | `cannot_verify` |
| **Full** symbol/reference graph for declared scope | `cannot_verify` |

**C6 band:** `partial` (stronger than post-070, same band as post-070).

---

## 3. What exact claim is allowed?

Wording aligned with spec 071 FR-005 / SC-004 and the ledger:

> For the **same 15 selected Bigtop target repositories** as specs 059/070, Universal Ctags **6.2.1** (`--extras=+r`, languages **C, C++, Python, Sh**) produced **bounded `source-visible` cross-language reference-role evidence**: exit **0**, **347,610** JSON records (**147,472** with reference roles), **8,432** unique reference files, with role/language/kind summaries recorded under the 071 stress root.

> Together with spec 070, Portolan has **import/header/script-level reference roles** across **Java/Go (070)** and **C/C++/Python/Sh (071)** for that scope. **C6 remains `partial`**: reference-role breadth increased; **full** symbol/reference graph and call graph are **not** proven.

Allowed bounded inferences:

- **Module/package/header coupling** and **dependency surface** at import/include/load sites (e.g. Airflow-heavy Python ref counts, C++ `header` + `system`/`local`).
- **Cross-language static coupling** at declaration boundaries — **not** intra-method usage, inheritance graphs, or invocation structure.

---

## 4. What claims remain disallowed?

Do **not** claim:

- A **full** Bigtop symbol/reference graph for the declared scope  
- **Method**, **class**, **field**, or **type-usage** reference edges  
- **Cross-reference resolution** (resolved def → all use sites)  
- **Call graph** or callee/caller structure  
- **C4** runtime topology (no services, no K8s, no live observation)  
- **C9** human/enterprise code-intelligence or “understands Bigtop architecture” parity  
- That 071 alone (or 070+071 together) equals **enterprise** or **architect-grade** code intelligence  
- Completeness over **all** Bigtop checkout, all repos, or all symbol kinds  
- That Python `unknown` + `imported` or `namespace` rows prove **semantic** module graphs beyond ctags’ reference-role tagging  

Also disallowed: treating **header `system`/`local`** or **shell `loaded`** as **method/class references** or as **xref/call-graph** evidence (per your boundary and spec 071 FR-006).

---

## 5. Does this change C4 runtime topology or C9 enterprise parity?

**No change to either.**

| Criterion | Prior (069 / post-070) | After 071 | Why |
| --- | --- | --- | --- |
| **C4** Runtime topology | `cannot_verify` | `cannot_verify` | Static ctags scan only; FR-007 prohibits runtime/K8s/services |
| **C9** Enterprise parity | `cannot_verify` | `cannot_verify` | Rubric: C9 needs C1–C8 **verified**, including **C4** and **full C6**; C4 and full C6 still missing |

```25:28:docs/specs/058-bigtop-runtime-symbol-parity-proof/reviews/parity-rubric-2026-06-02.md
- If C4 runtime topology is `not_assessed`, do not claim verified runtime
  topology.
- If C6 full symbol/reference graph is `not_assessed`, do not claim enterprise
  code-intelligence parity.
```

071 does not touch C3 deployment model or C5 API/catalog surfaces; only the **C6 import/reference-role** facet widens.

---

## 6. What next evidence is required to verify full C6?

Same bar as 069/070; 071 does not reduce it:

1. **Symbol-level references** — method/field/type (or language-equivalent) `ref` roles or another indexer (SCIP, LSIF, CodeQL, JDTLS, etc.), with full producer-run ledger (command, exit, scope, counts, hashes).  
2. **Cross-reference linkage** — references tied to definitions (or explicit unresolved targets), not orphan import/header strings.  
3. **Scope coverage & validation** — declared scope, per-language/kind coverage, and proof the result is a **queryable** def/ref graph for that scope (not only aggregate JSONL counts).  
4. **JVM/build path** where compiled artifacts block def/ref — documented build or indexer path (064/069 context).  
5. **Call graph** — separate from import/header roles; stays `cannot_verify` until a call-capable producer run exists.

**C9** can only move after **C4** is `verified` (runtime-visible export for bounded Bigtop scope) **and** **full C6** is `verified` — or the product claim is **explicitly narrowed** so it no longer asserts enterprise/human architecture parity (narrowed claims are **not** C9).

---

## Summary

| Question | Answer |
| --- | --- |
| C6 breadth beyond 070? | **Yes** — adds C/C++/Python/Sh reference roles 070 excluded |
| Full C6 verified? | **No** — still **`partial`** |
| Allowed headline | Bounded **cross-language import/header/script reference roles** on 15 targets; C6 **stronger but partial** |
| C4 / C9 changed? | **No** — both **`cannot_verify`** |
| Consolidated C6 | `partial`: definitions (059) + Java/Go package imports (070) + C/C++/Python/Sh ref roles (071); **full** symbol/reference graph and call graph **`cannot_verify`** |

**C9 assessment:** Unchanged. More import-role breadth does not satisfy the enterprise parity threshold while C4 and full C6 remain unverified.
