# Spec Delta — ontology

## ADDED Requirements

### Requirement: Manifest-detected dependencies across language ecosystems
The deterministic core SHALL detect declared dependencies from language-native
manifests across the ecosystems it targets. Each detected dependency SHALL
produce a `depends-on` edge with evidence-state `metadata-visible`. A unit
without a recognized manifest SHALL be recorded with evidence `unknown`, not
guessed. The core SHALL support JVM manifests (Maven `pom.xml`, Gradle
`build.gradle`/`build.gradle.kts`) as the first implementation; the language
registry is extensible to additional ecosystems without contract changes.

#### Scenario: A Maven POM declares a dependency on another in-perimeter module
- GIVEN a repository contains a pom.xml declaring a dependency on `org.apache:shared-lib`
- AND `org.apache:shared-lib` is another unit inside the expedition perimeter
- WHEN the core processes the manifest
- THEN a `depends-on` edge connects the repository to `org.apache:shared-lib`
- AND the edge evidence-state is `metadata-visible`

#### Scenario: A Gradle build declares an external dependency
- GIVEN a repository contains a build.gradle with `implementation 'org.apache:commons:1.0'`
- AND `org.apache:commons` is NOT inside the expedition perimeter
- WHEN the core processes the manifest
- THEN an external node is created for `org.apache:commons`
- AND a `depends-on` edge connects the repository to the external node
- AND the external node is flagged `external` and is not crawled

#### Scenario: A repository with no recognized manifest
- GIVEN a repository contains only Python files with no requirements.txt or pyproject.toml
- WHEN the core processes the repository
- THEN the repository is recorded as a unit with evidence `unknown`
- AND no `depends-on` edges are fabricated from filenames or guesses

#### Scenario: A multi-module Maven project has inter-module dependencies
- GIVEN a parent POM declares modules `core` and `web`
- AND module `web`'s pom.xml declares a dependency on `core`'s groupId:artifactId
- WHEN the core processes the multi-module project
- THEN a `depends-on` edge connects `web` to `core`
- AND the edge evidence-state is `metadata-visible`

#### Scenario: Manifest detection is extensible without contract changes
- GIVEN the language registry declares a new language with a manifest format
- WHEN a repository contains that manifest
- THEN the core detects dependencies from it using the same edge vocabulary
- AND no ontology or reading-layer change is needed
