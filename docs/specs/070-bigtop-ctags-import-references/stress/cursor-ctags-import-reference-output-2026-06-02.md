# Claim-boundary assessment: Spec 070 vs C6 / C9

Run metadata:

- model: Cursor Agent `composer-2.5`
- branch: `codex/070-bigtop-ctags-import-references`
- execution_mode: `cursor-agent --print --mode ask --trust`
- editing: output captured from command; metadata block added after capture

**Mode:** DESIGN_REVIEW (read-only; packet evidence + repo ledgers)  
**Evidence basis:** Spec 069 ledger, spec 070 ledger/SC-004, producer counts you supplied (not re-run locally in this packet)

---

## 1. Does this move C6 beyond definitions-only evidence?

**Yes — verified partial improvement within C6, still not full C6.**

Spec 059 Universal Ctags was **definitions-only** (mass `def`, **0** `ref`/`call` roles per 069 synthesis). Spec 070 adds **873,435** records with `roles: "imported"` on Java/Go package kinds (`--extras=+r`, `--kinds-Java=p --kinds-Go=p`), exit **0**, same 15-target scope.

That is **real reference-role producer output**, not a relabel of definitions. C6 is no longer “definitions-only ctags”; it is **definitions + bounded package import references**.

**Evidence state for the new slice:** `verified` (producer run) for **bounded** `source-visible` package import-reference evidence.

---

## 2. Is C6 now verified full symbol/reference graph, or still partial?

**Still `partial`. Not verified full symbol/reference graph.**

069/058 treat **full C6** as definitions **and** references (symbol-level, cross-resolvable), not import declarations alone. Spec 070 FR-005/SC-004 and the 070 ledger explicitly keep full symbol/reference graph and call graph as **`cannot_verify`**.

| Sub-claim | After 070 |
| --- | --- |
| Broad symbol **definitions** (059) | `verified` bounded |
| Package **import** references (070) | `verified` bounded |
| Method/class **references** | `cannot_verify` |
| **Call graph** | `cannot_verify` |
| **Full** symbol/reference graph for declared scope | `cannot_verify` |

C6 **band** stays **`partial`**; **strength** inside that band increases (definitions-only → definitions + import refs).

---

## 3. Exact claim allowed after this slice

Wording aligned with spec 070 and the 070 ledger:

> For the **same 15 selected Bigtop target repositories** as spec 059, Universal Ctags **6.2.1** produced **bounded, `source-visible` package import-reference evidence**: exit code **0**, **873,435** `roles: "imported"` records, **59,704** unique importing files, with per-repo and top-package summaries recorded under the spec 070 stress root.

> C6 is **stronger than definitions-only** but remains **`partial`**: package import references are proven; **full** symbol/reference graph and call graph are **not** proven.

Allowed inference (bounded): **module/package coupling** and **external dependency footprint** at import-declaration sites (e.g. heavy `org.apache.hadoop.*`, JUnit, SLF4J in the counts you gave)—not intra-method usage, inheritance graphs, or invocation structure.

---

## 4. Claims that remain disallowed

Do **not** claim:

- A **full** Bigtop symbol/reference graph for the declared scope  
- **Method** or **class** reference edges (including “usage” beyond `import` lines)  
- **Call graph** or invocation/callee structure  
- **Cross-reference resolution** (def → all use sites at symbol granularity)  
- **Runtime** deployment/topology (C4) from this producer  
- **Human/enterprise architecture or code-intelligence parity** (C9)  
- Completeness over **all** Bigtop checkout / all languages / all symbol kinds  
- That Portolan “understands Bigtop architecture” like an architect or enterprise CI tool  

Also disallowed: treating top imported names like `java.util.List` as proof of **type usage** everywhere in code—they are **import-role package tags** under a package-only kind filter, not a usage/call graph.

---

## 5. Does this change C4 runtime topology or C9 enterprise parity?

**No change to either.**

| Criterion | Prior (069) | After 070 | Why |
| --- | --- | --- | --- |
| **C4** Runtime topology | `cannot_verify` | `cannot_verify` | No services started, no K8s contact, no live observation; static ctags import scan only |
| **C9** Enterprise/human parity | `cannot_verify` | `cannot_verify` | Rubric still requires verified C4 + **full** C6 (or an explicitly narrowed claim that **excludes** runtime and reference graph—enterprise parity is **not** that narrowed claim) |

C3/C5 are untouched by this slice; only the **C6 import-reference** facet moves.

---

## 6. Next evidence required to verify **full** C6

Per 069 “Next Evidence Required” and spec 064/070 out-of-scope, full C6 needs **reference-capable** output beyond package imports, plus coverage/validation for the **declared scope**:

1. **Symbol-level references** — method/field/type (or language-equivalent) `ref` roles or an equivalent indexer (SCIP, LSIF, CodeQL, JDTLS, etc.), with producer-run ledger: command, exit code, scope, counts, hashes.  
2. **Cross-reference linkage** — evidence that references resolve to definitions (or explicit unresolved targets), not orphan import strings.  
3. **Coverage & validation** — declared scope, language/kind coverage, spot-checks or schema checks that the graph is queryable for that scope (not only aggregate counts).  
4. **JVM path if required** — where 064 blocked compiled-artifact def/ref: built classes or an indexer that does not depend on unavailable build outputs, documented in the ledger.  
5. **Call graph (separate)** — if “full C6” in your rubric includes call edges; 070 does not advance that; it stays `cannot_verify` until a call-capable producer run exists.

**C9** can only be reconsidered after **C4** moves to `verified` (or `runtime-visible` capture with approval) **and** **full C6** is `verified` for the claim scope—or the product claim is **explicitly narrowed** so it no longer asserts enterprise/human architecture parity.

---

## Summary table

| Question | Answer |
| --- | --- |
| Beyond definitions-only? | **Yes** (`verified` bounded import-reference evidence) |
| Full C6 verified? | **No** — still **`partial`** |
| C4 / C9 changed? | **No** — both **`cannot_verify`** |
| Allowed headline | Bounded **package import-reference** graph for 15 targets; C6 **stronger but partial** |
| Blocker for full C6 | Method/class refs, xref resolution, coverage proof; call graph separate |

**Consolidated C6 state:** `partial` — upgraded from “definitions-only partial” to “definitions + package import references partial”; full symbol/reference graph remains **`cannot_verify`**.
