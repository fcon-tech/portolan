# Design — multi-language-dependency-detection

## Decision

Add a manifest-based dependency detection layer to the Go core, driven by a
declarative language registry. Each language declares its manifest filenames
and format; the core dispatches to the matching parser and emits `depends-on`
edges.

## Language registry (declarative)

A language config is a data record (not code):

```
{
  id: "java",
  extensions: [".java", ".kt", ".scala"],
  manifests: [
    { filename: "pom.xml", format: "maven" },
    { filename: "build.gradle", format: "gradle" },
    { filename: "build.gradle.kts", format: "gradle" },
  ],
}
```

The registry is a closed table the core loads at startup. Languages not in
the registry are `unknown` — the core does not guess.

## Manifest parsers (first implementation: JVM)

### Maven (pom.xml)

Parse `<dependencies><dependency>` elements. Each yields a `depends-on` edge:
- `groupId:artifactId` is the target node ID.
- If the target resolves inside the perimeter → internal edge.
- If outside → external node + edge.
- `version` is recorded as evidence metadata, not enforced.
- Parent-POM inheritance (`<parent>`) resolves the parent's dependencies too.
- `<dependencyManagement>` is NOT an active dependency — it is a version
  constraint. Only `<dependencies>` under a `<dependency>` block counts.

Evidence state: `metadata-visible` (manifest-declared, not source-verified).

### Gradle (build.gradle / build.gradle.kts)

Gradle is a Groovy/Kotlin DSL, not a structured format. The parser uses a
bounded line-level extraction:
- `implementation 'group:artifact:version'`
- `api 'group:artifact:version'`
- `compileOnly 'group:artifact:version'`
- `runtimeOnly 'group:artifact:version'`
- `project(':module-name')` → internal module dependency

External string-declared dependencies (`group:artifact:version`) yield
external nodes. `project(...)` references yield internal edges.

Evidence state: `metadata-visible`.

### Multi-module projects

A Maven multi-module project has a parent POM with `<modules>`. Each module
is a sub-unit. Inter-module dependencies (module A depends on module B) are
detected when module A's pom.xml declares a dependency on module B's
groupId:artifactId.

## Relationship to existing Go detection

The Go manifest parser (go.mod) is already one instance of this pattern. The
change generalizes it: go.mod is one language config among many, not a
special case. The core's relationship detection dispatches by language, not
by hardcoded Go logic.

## Status

Design proposal. The parsing internals (XML library choice, Gradle regex
precision, multi-module traversal) are implementation-TBD. The spec delta
defines the contract; the implementation slice delivers the parsers.

## Reversibility

High. Each language parser is additive; a missing parser yields no edges
(honest-empty), not incorrect edges.

## Relationships

- Inspiration: Understand-Anything's LanguageConfig registry pattern and
  per-language import resolver design.
- The Go-core stays the producer; the JS reading layer consumes unchanged.
- Composes with `jvm-source-references` for structural (non-manifest) edges.
