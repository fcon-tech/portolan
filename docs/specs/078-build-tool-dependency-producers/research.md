# Research

## Decision: Recommend CycloneDX Maven/Gradle Outputs First

Use CycloneDX Maven and Gradle producer recipes as the immediate
build-tool-specific dependency evidence path.

Rationale:

- Current Portolan already normalizes CycloneDX-style component/dependency
  evidence.
- The official Maven dependency plugin supports JSON dependency-tree output,
  but that would require a new parser contract before Portolan could consume it
  safely.
- CycloneDX Maven and Gradle plugins are mature OSS producer families for
  direct/transitive dependency SBOMs.

Sources:

- Apache Maven Dependency Plugin documents `dependency:tree` JSON output:
  https://maven.apache.org/plugins/maven-dependency-plugin/tree-mojo.html
- CycloneDX Maven plugin documents Maven SBOM generation:
  https://cyclonedx.github.io/cyclonedx-maven-plugin/
- CycloneDX Gradle plugin describes aggregate direct/transitive dependency
  SBOM generation:
  https://github.com/CycloneDX/cyclonedx-gradle-plugin

Alternatives considered:

- Add a Maven dependency-tree JSON importer now. Rejected for this slice:
  useful, but a new parser deserves a separate output-contract spec and
  fixtures.
- Parse `pom.xml`/Gradle files in Portolan. Rejected: this is per-language /
  per-build-system scanner creep.
- Rely only on Syft. Rejected: useful generic SBOM route, but not specific
  enough when build manifests prove Maven/Gradle is the dominant gap.

## Decision: Plans Only, No Native Execution

`context prepare` will emit approval-gated recipes and will not run Maven,
Gradle, wrapper scripts, or CycloneDX plugins.

Rationale:

- Build tools can download dependencies/plugins, execute build logic, write
  caches, and mutate target-local output directories.
- Portolan's default is local-first and read-only.
- The active 076/074 boundary already forbids unapproved runtime/build-style
  side effects.

Alternatives considered:

- Run `mvn`/`gradle` automatically when installed. Rejected as unsafe and
  contrary to the constitution.
- Mark installed Maven/Gradle as supported evidence. Rejected; installed tools
  are prerequisites, not evidence.

## Decision: Keep Commands Bounded But Conservative

Commands will write under the context `tool-outputs` directory, carry explicit
network/mutation warnings, and require user approval.

Rationale:

- Agents need concrete next steps.
- The commands are operator recipes, not Portolan receipts.
- The output directory contract prevents legacy root-level `run/` or stale
  `.portolan/stress` contamination.

Alternatives considered:

- Omit concrete args to avoid risk. Rejected because vague advice did not move
  the Bigtop stress gap forward.
- Generate one command per repository. Rejected for now; it creates noise and
  encourages broad build execution. This slice emits family-level plans.
