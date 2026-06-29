# Spec Delta — ontology

## ADDED Requirements

### Requirement: Mobile framework manifests detected
The deterministic core SHALL detect declared dependencies from mobile-
ecosystem manifests: Swift Package Manager (`Package.swift`), Flutter/Dart
(`pubspec.yaml`), and React Native (`package.json`). Each detected dependency
SHALL produce a `depends-on` edge with evidence-state `metadata-visible`.
Android Gradle modules reuse the JVM Gradle parser without a separate parser.

#### Scenario: A Swift Package declares an external dependency
- GIVEN a Swift project contains Package.swift with `.package(url: "https://github.com/Alamofire/Alamofire")`
- WHEN the core processes the manifest
- THEN an external node is created for the Alamofire package
- AND a `depends-on` edge connects the project to the external node

#### Scenario: A Flutter pubspec declares a dependency
- GIVEN a Flutter project contains pubspec.yaml with `http: ^0.13.0` under dependencies
- WHEN the core processes the manifest
- THEN a `depends-on` edge is emitted for the `http` package
- AND the edge evidence-state is `metadata-visible`
