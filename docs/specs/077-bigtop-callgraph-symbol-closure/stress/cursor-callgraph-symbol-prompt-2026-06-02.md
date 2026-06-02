# Cursor Stress Prompt: Spec 077 Callgraph And Symbol Closure

You are validating Portolan claim boundaries for Bigtop architecture evidence.

Use only the facts below. Do not infer missing evidence.

Facts:

- Spec 075 merged via PR #53 and verified only confirmed bounded producer
  outputs beyond Syft/CycloneDX.
- Spec 075 explicitly kept complete runtime topology, full symbol/reference
  graph, call graph, and Cursor+Portolan human/enterprise parity as
  `cannot_verify`.
- Spec 077 probes the full symbol/reference/call graph gap.
- Current local PATH probe for spec 077:
  - `scip`: not found
  - `codeql`: not found
  - `srcml`: not found
  - `lsif-java`: not found
  - `lsif-go`: not found
  - `src-cli`: not found
  - `java-language-server`: not found
  - `jdtls`: not found
  - `joern`: not found
  - `cscope`: not found
  - `mvn`: found
  - `java`: found
  - `ctags`: found
  - `gopls`: found
  - `jdeps`: found
- Prior specs already verified:
  - Ctags Java/Go package import-reference roles are source-visible and broad
    but not resolved def/use or call graph.
  - Ctags C/C++/Python/Sh reference roles are source-visible and broad but not
    resolved def/use or call graph.
  - gopls evidence is selected-file symbol output, not Bigtop-wide graph.
  - jdeps evidence is bounded compiled-artifact package dependency output, not
    call graph and not full production Bigtop JVM graph.
  - Maven and Java are prerequisites/build/runtime tools, not graph exporters
    by themselves.
- Spec 077 decision record rejects native Portolan graph extraction in this
  slice and records full C6/callgraph as `cannot_verify` until a mature graph
  producer is approved, installed/enabled, run, ledgered, and independently
  reviewed.
- Spec 074 runtime health execution remains approval-gated and was not run by
  spec 077.
- Spec 076 Cursor enterprise parity has not run yet.

Questions:

1. Does spec 077 prove a full Bigtop symbol/reference graph?
2. Does spec 077 prove a Bigtop call graph?
3. Can Ctags/gopls/jdeps/Maven be combined to claim enterprise code
   intelligence parity?
4. What exactly is verified by spec 077?
5. What remains `cannot_verify`?
6. What next action would be required before any C6/callgraph claim upgrade?

Return a concise verdict with evidence-state labels. Preserve
`cannot_verify`, `not_assessed`, and `partial`; do not collapse them into
success.
