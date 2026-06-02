# Producer Availability Ledger

Spec: `docs/specs/077-bigtop-callgraph-symbol-closure/`

Date: 2026-06-02

Probe type: read-only PATH/version checks only. No tools were installed, no
network access was used, no Bigtop target repository was mutated, and no
runtime service was started.

## Availability

verified:

```text
scip	not_found
codeql	not_found
srcml	not_found
lsif-java	not_found
lsif-go	not_found
src-cli	not_found
java-language-server	not_found
jdtls	not_found
mvn	found	/home/linuxbrew/.linuxbrew/bin/mvn
gradle	not_found
cs	not_found
java	found	/home/linuxbrew/.linuxbrew/bin/java
ctags	found	/home/linuxbrew/.linuxbrew/bin/ctags
gopls	found	/home/fall_out_bug/.local/bin/gopls
jdeps	found	/home/linuxbrew/.linuxbrew/bin/jdeps
joern	not_found
cscope	not_found
```

## Versions For Available Adjacent Tools

verified:

```text
Apache Maven 3.9.16
OpenJDK 26.0.1
Universal Ctags 6.2.1
gopls v0.21.1
jdeps 26.0.1
```

## Interpretation

verified:

- No full resolved symbol/reference/call graph producer is currently available
  in PATH.
- Available tools are adjacent and already bounded by prior specs:
  - `ctags`: source-visible tag/reference-role evidence, not resolved def/use
    or call graph.
  - `gopls`: Go language server; prior evidence is selected-file symbol output,
    not full Bigtop cross-language graph.
  - `jdeps`: compiled-artifact package dependency analysis; prior evidence is
    narrow and artifact-dependent.
  - `mvn` and `java`: build/runtime prerequisites, not graph exporters by
    themselves.

cannot_verify:

- Full Bigtop symbol/reference graph from currently available local producers.
- Bigtop call graph from currently available local producers.

blocked pending separate approval/tooling:

- Installing or enabling SCIP/LSIF/JDT/CodeQL/srcML/Joern-style producers.
- Running target builds to produce complete compiled artifacts.
- Mutating target repos to import IDE workspaces or generated indexes.
