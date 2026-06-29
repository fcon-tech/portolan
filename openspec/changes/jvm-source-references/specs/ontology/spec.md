# Spec Delta — ontology

## ADDED Requirements

### Requirement: JVM source references detected from import statements
The deterministic core SHALL detect `references` edges from JVM source files
(`.java`, `.kt`, `.scala`) by resolving `import` statements to in-perimeter
units via a fully-qualified-name index. Each resolved import SHALL produce a
`references` edge with evidence-state `metadata-visible`. Unresolved imports
SHALL produce external nodes. Source references and manifest dependencies are
complementary — both MAY exist for the same target pair.

#### Scenario: A Java import resolves to an in-perimeter module
- GIVEN module A contains `import org.apache.spark.sql.Dataset`
- AND module B (inside the perimeter) defines `org.apache.spark.sql.Dataset`
- WHEN the core processes JVM source
- THEN a `references` edge connects module A to module B
- AND the edge evidence-state is `metadata-visible`

#### Scenario: An unresolved import becomes an external node
- GIVEN module A contains `import com.google.gson.Gson`
- AND no unit inside the perimeter defines `com.google.gson.Gson`
- WHEN the core processes JVM source
- THEN an external node is created for `com.google.gson.Gson`
- AND a `references` edge connects module A to the external node

#### Scenario: Source reference and manifest dependency coexist
- GIVEN module A's pom.xml declares a dependency on module B
- AND module A's source imports a class from module B
- WHEN the core processes both manifest and source
- THEN both a `depends-on` edge (manifest) and a `references` edge (source) exist
- AND each carries its own evidence-state independently

#### Scenario: A star import is handled honestly
- GIVEN module A contains `import org.apache.spark.sql.*`
- AND the `org.apache.spark.sql` package spans multiple units
- WHEN the core processes the star import
- THEN the reference is recorded as `not_assessed` (ambiguous target)
- AND it is not silently resolved to one unit
