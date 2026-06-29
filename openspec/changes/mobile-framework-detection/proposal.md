## Why

After JVM (first priority), Portolan targets mobile frameworks: iOS (Swift
Package Manager), Android (Gradle), and cross-platform (React Native, Flutter).
These ecosystems have their own manifest formats and source languages. The
language registry from `multi-language-dependency-detection` is extensible by
design — this change adds the mobile-specific manifest parsers and source
detectors.

## What Changes

- Add mobile manifest parsers to the language registry:
  - Swift: `Package.swift` (Swift Package Manager dependencies)
  - Android: `build.gradle` / `build.gradle.kts` (already covered by JVM
    Gradle parser — this slice confirms Android-specific module structure)
  - React Native: `package.json` (npm dependencies — same parser as JS)
  - Flutter: `pubspec.yaml` (Dart package dependencies)
- Emit `depends-on` edges from each manifest format.
- Source-level `references` detection for Swift (`.swift` imports) and Dart
  (`.dart` imports) follows the same FQN-index pattern as `jvm-source-references`.

## Capabilities

### Modified Capabilities

- `ontology`: the language registry is extended to mobile ecosystems.

## Impact

- Depends on: `multi-language-dependency-detection` (the registry + framework).
- Composes with: `jvm-source-references` (same FQN-index approach for Swift/Dart).
- Out of scope: mobile-specific UI component analysis; App Store / Play Store
  metadata.
