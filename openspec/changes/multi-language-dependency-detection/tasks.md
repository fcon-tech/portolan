# Tasks — multi-language-dependency-detection

> Reconciled 2026-08-23 against the implementation. Items are checked only
> where direct code evidence exists (`internal/relationships/`); commits
> 8502e76, b48a831, 55f7fa7, 76abda9, bd12c71.

## Spec artifacts

- [x] proposal.md
- [x] design.md
- [x] specs/ontology/spec.md (ADDED: manifest-detected deps across languages)

## Implementation slices

### Slice 1: Language registry + JVM manifest parsing
- [x] Language registry: manifest filename → format map
      (`manifestFilenames()`, `internal/relationships/jvm.go:105` — a Go map,
      not the declarative config table the design sketched)
- [x] Maven parser: parse pom.xml `<dependency>` elements → depends-on edges
      (`detectMavenPom`, `internal/relationships/jvm.go:117`)
- [x] Gradle parser: bounded line-extract `implementation/api/project(...)`
      (`detectGradle`, `internal/relationships/jvm.go:198`)
- [x] Multi-module Maven: Maven coordinates as canonical ID (b48a831)
- [x] External classification: unresolved targets → external nodes (b48a831)
- [x] Evidence state: all manifest edges are `metadata-visible` (verified in
      `addPackageNode`/`addEdge` call sites)
- [x] Integration test: Bigtop landscape → connected graph (via demo-from-real-scan,
      commit 198b5b5)

### Slice 2: Additional ecosystems (follow-on)
- [x] Python: requirements.txt, pyproject.toml (FormatPython,
      `relationships.go:259`)
- [x] JavaScript/TypeScript: package.json dependencies (FormatNpm,
      `detectNpmPackageJson`, `jvm.go:266`)
- [x] Rust: Cargo.toml (FormatCargo, `relationships.go:259`)
- [x] Ruby: Gemfile (FormatGemfile, `relationships.go:259`)
- [ ] PHP: composer.json require — not implemented (no FormatComposer)
- [x] Swift: Package.swift dependencies (FormatSwiftPM → `mobile.go:27`,
      landed under mobile-framework-detection)

### Open questions
- [ ] Should the language registry live in Go source, JSON, or YAML?
- [ ] Gradle Kotlin DSL (build.gradle.kts) — same regex approach or structured?
- [ ] How to handle Gradle version catalogs (libs.versions.toml)?
- [ ] Should `<dependencyManagement>` constraints be surfaced as evidence?
