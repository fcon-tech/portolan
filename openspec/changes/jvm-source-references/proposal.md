## Why

Manifest detection (`multi-language-dependency-detection`) gives `depends-on`
edges — declared dependencies. But a landscape map needs **structural** edges
too: which modules actually reference each other at the source level, beyond
what manifests declare. A manifest says "I depend on commons-lang3"; the source
shows HOW — which classes call which, which interfaces are implemented.

Structural `references` edges make the difference between a dependency graph
(a flat SBOM-like view) and a connected landscape (the product's core promise:
"a landscape shows connected structure, not a flat inventory").

For JVM ecosystems, source-level references are detectable from `import`
statements and fully-qualified class references — the same approach
Understand-Anything uses with its dotted-FQN suffix index for Java/Kotlin.

## What Changes

- Add a **JVM source reference detector** to the Go core that scans `.java`,
  `.kt`, `.scala` files for `import` statements and cross-module class
  references.
- Emit `references` edges (not `depends-on`) with evidence-state
  `metadata-visible`.
- Use a **dotted-FQN suffix index** (inspired by Understand-Anything) to
  resolve imports to in-perimeter targets: `org.apache.spark.sql.Dataset`
  resolves to the unit that defines that class.
- Unresolved imports become external nodes (same as manifest detection).
- Source references and manifest dependencies are COMPLEMENTARY: a target
  can have both a `depends-on` (manifest) and a `references` (source) edge
  to the same target.

## Capabilities

### Modified Capabilities

- `ontology`: the core SHALL detect `references` edges from JVM source, not
  just from Go imports. The edge vocabulary is unchanged.

## Impact

- Depends on: `multi-language-dependency-detection` (manifest detection
  provides the perimeter; source references operate within it).
- Composes with: `demo-from-real-scan` (structural edges make the demo map
  connected, not just dependency-only).
- Out of scope: call-graph completeness (this is references, not a complete
  call graph); non-JVM source references (follow-on for other ecosystems).
