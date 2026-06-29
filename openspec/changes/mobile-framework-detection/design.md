# Design — mobile-framework-detection

## Decision

Extend the language registry with mobile manifest formats. Each is a new
entry in the registry, dispatched by the same manifest-detection framework.

## Manifest formats

### Swift Package Manager (Package.swift)
Swift Package Manager uses a Swift DSL manifest. The parser extracts
`.package(url:...)` and `.product(name:...)` declarations. External URL-based
dependencies become external nodes; local path dependencies become internal
edges.

### Flutter / Dart (pubspec.yaml)
YAML format with a `dependencies:` section. Each entry is a package name +
version constraint. Resolved against the perimeter; unresolved → external.

### React Native (package.json)
Same parser as JavaScript/TypeScript. React Native projects are Node projects
with `react-native` in dependencies.

### Android (build.gradle)
Already covered by the JVM Gradle parser. Android-specific: `applicationId`,
`minSdkVersion`, and multi-module structure (`:app`, `:lib`). No new parser
needed — the JVM Gradle parser handles it.

## Source-level references

- `.swift`: `import ModuleName` → resolves to the module that exports it
- `.dart`: `import 'package:name/file.dart'` → resolves to the package

Both use the FQN/path-index approach from `jvm-source-references`.

## Status

Design proposal. Implementation follows after JVM detection is proven.

## Reversibility

High. Additive language configs; absent parsers yield no edges.
