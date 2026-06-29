# Tasks — multi-language-dependency-detection

## Spec artifacts

- [x] proposal.md
- [x] design.md
- [x] specs/ontology/spec.md (ADDED: manifest-detected deps across languages)

## Implementation slices (design TBD)

### Slice 1: Language registry + JVM manifest parsing
- [ ] Language registry: declarative config table (id, extensions, manifests[])
- [ ] Maven parser: parse pom.xml `<dependency>` elements → depends-on edges
- [ ] Gradle parser: bounded line-extract `implementation/api/project(...)` → edges
- [ ] Multi-module Maven: resolve `<modules>` + inter-module deps
- [ ] External classification: unresolved targets → external nodes
- [ ] Evidence state: all manifest edges are `metadata-visible`
- [ ] Integration test: run on Bigtop landscape → connected graph (not isolated nodes)

### Slice 2: Additional ecosystems (follow-on)
- [ ] Python: requirements.txt, pyproject.toml [project.dependencies]
- [ ] JavaScript/TypeScript: package.json dependencies
- [ ] Rust: Cargo.toml [dependencies]
- [ ] Ruby: Gemfile
- [ ] PHP: composer.json require
- [ ] Swift: Package.swift dependencies

### Open questions
- [ ] Should the language registry live in Go source, JSON, or YAML?
- [ ] Gradle Kotlin DSL (build.gradle.kts) — same regex approach or structured?
- [ ] How to handle Gradle version catalogs (libs.versions.toml)?
- [ ] Should `<dependencyManagement>` constraints be surfaced as evidence?
