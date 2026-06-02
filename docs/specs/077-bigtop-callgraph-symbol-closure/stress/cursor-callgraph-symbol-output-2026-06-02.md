## Spec 077 verdict: claim boundaries

**Mode:** Ask / claim-boundary validation
**Scope:** Facts provided + spec 077 review artifacts only. No inference beyond recorded evidence.

### 1. Does spec 077 prove a full Bigtop symbol/reference graph?

**No — `cannot_verify`**

Spec 077 explicitly records full Bigtop symbol/reference graph as
**`cannot_verify`**. The PATH probe found no mature resolved-graph producer
(`scip`, `lsif-*`, `src-cli`, `codeql`, `jdtls`, etc. all **not found**).
Existing tools (`ctags`, `gopls`, `jdeps`) are retained as **partial** only and
are not upgraded.

### 2. Does spec 077 prove a Bigtop call graph?

**No — `cannot_verify`**

Full Bigtop call graph is **`cannot_verify`**. No call-graph exporter is
installed or run. The decision record rejects using Ctags, Maven, or jdeps as
call-graph proxies.

### 3. Can Ctags / gopls / jdeps / Maven be combined to claim enterprise code intelligence parity?

**No — `cannot_verify` (parity); `partial` (constituent evidence only)**

| Tool | Evidence state | Why it cannot stack into parity |
| --- | --- | --- |
| **Ctags** | `partial` / `source-visible` | Tag/reference roles, not resolved def/use or call graph |
| **gopls** | `partial` | Selected-file Go symbols, not Bigtop-wide cross-language graph |
| **jdeps** | `partial` / bounded | Compiled-artifact package deps, not call graph or full production JVM graph |
| **Maven / Java** | prerequisites only | Build/runtime tools, not graph exporters |

Combining them does **not** upgrade to enterprise code-intelligence parity.
Cursor+Portolan human/enterprise parity remains **`cannot_verify`** (carried
from spec 075; spec 076 not run).

### 4. What exactly is verified by spec 077?

**`verified`:**

- **Producer absence:** No full resolved symbol/reference/call-graph producer is
  available in local PATH.
- **PATH probe ledger:** Exact found/not-found state for listed tools
  (read-only; no install, network, target mutation, or runtime startup).
- **Adjacent tool versions:** `mvn` 3.9.16, `java` 26.0.1, `ctags` 6.2.1,
  `gopls` 0.21.1, `jdeps` 26.0.1.
- **Decision record:** Mature OSS producers compared; native Portolan graph
  extraction **rejected** for this slice.
- **Claim boundary reaffirmation:** Prior bounded evidence strengthens C6
  **only partially** — no broad upgrade.
- **Process closure:** The symbol/reference/call-graph gap is explicitly owned
  and documented rather than hidden inside parity work.

### 5. What remains `cannot_verify` / `not_assessed`?

**`cannot_verify`:**

- Full Bigtop symbol/reference graph
- Bigtop call graph
- Full C6 / callgraph closure
- Cursor + Portolan human/enterprise parity
- All mature graph producers not installed (`SCIP/LSIF`, CodeQL, JDT LS,
  Joern, srcML as resolved graph, etc.)

**`partial` (not success):**

- Ctags Java/Go/C/C++/Python/Sh reference roles
- gopls selected-file symbol output
- jdeps bounded compiled-artifact package dependencies

**`not_assessed` (outside spec 077 scope / not run):**

- Spec **074** runtime health execution (approval-gated, not run)
- Spec **076** Cursor enterprise parity (not run)
- Spec 077 independent review lanes T014-T015 (tasks still open)
- Any graph output from tools that were never installed or executed

### 6. Next action before any C6/callgraph claim upgrade

Per the decision record, a claim upgrade requires **all** of:

1. **Explicit approval** for one mature graph producer family (e.g. SCIP/LSIF,
   CodeQL DB, JDT LS adapter) **or** approved target builds/index generation
   with documented local-first / read-only / mutation boundaries.
2. **Install and enable** the chosen producer locally.
3. **Run** it against Bigtop with command evidence, input roots, schema/ledger
   paths, and documented incompleteness.
4. **Independent review** that accepts the claim upgrade (spec 077 plan:
   non-GPT review before any C6/callgraph upgrade).

Until then: **keep full C6/callgraph as `cannot_verify`**; do not infer from
partial stacks or prerequisites.

### Bottom line

Spec 077 **does not close** the graph gap — it **documents and gates** it. It
verifies **absence of a safe resolved-graph producer** and **rejects claim
inflation** from partial adjacent tools. Full symbol/reference graph, call
graph, and enterprise parity all remain **`cannot_verify`**.
