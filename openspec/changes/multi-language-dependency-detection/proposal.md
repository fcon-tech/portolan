## Why

The deterministic core detects declared dependencies ONLY from Go manifests
(go.mod) and Go source imports. Real target landscapes are JVM (Java/Scala/
Kotlin), mobile (Swift/Kotlin/React-Native), and polyglot — not Go. On a JVM
landscape like Bigtop, the core emits ZERO edges: no go.mod, no .go files.
The resulting map is isolated nodes with no relationships, which is useless.

The core SHALL detect declared dependencies from language-native manifests
across the ecosystems Portolan targets (JVM first, then mobile, then the rest),
so that a landscape map is connected and adequate without hand-crafted data.

This change takes inspiration from the LanguageConfig registry pattern and
the per-language import resolver design proven in the Understand-Anything
project, adapted to Portolan's Go-core + JS-reading-layer architecture.

## What Changes

- Introduce a **language registry** (declarative configs): each language
  declares its file extensions, manifest filenames, and manifest format.
- Add **manifest parsers** to the Go core that read language-native
  manifests and emit `depends-on` edges with evidence-state
  `metadata-visible`.
- JVM manifests are the FIRST implementation: Maven (`pom.xml`) and Gradle
  (`build.gradle`, `build.gradle.kts`). Mobile and scripting ecosystems
  follow in subsequent slices.
- Manifest-detected edges are `metadata-visible` (declared, not source-
  verified). Source-level `references` edges are a separate change
  (`jvm-source-references`).
- A unit (repository) without a recognized manifest SHALL be recorded with
  evidence `unknown`, not guessed.

## Capabilities

### Modified Capabilities

- `ontology`: edges SHALL be detectable from language-native manifests,
  not just Go. The edge vocabulary is unchanged; the detection surface
  expands.

## Impact

- Depends on: nothing (this is the foundation layer for all non-Go
  landscapes).
- Composes with: `jvm-source-references` (source-level edges beyond
  manifest-only), `demo-from-real-scan` (proves the pipeline end-to-end).
- Out of scope: source-level reference/call detection (separate change);
  the parsing algorithm internals (design TBD at implementation time).
