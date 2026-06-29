# Design — jvm-source-references

## Decision

Add a JVM source reference detector to the Go core. Scan `.java`, `.kt`,
`.scala` files for `import` statements; resolve each import to an in-perimeter
unit via a dotted-FQN suffix index; emit `references` edges.

## The dotted-FQN suffix index

Inspired by Understand-Anything's `buildSuffixIndex` (extract-import-map.mjs):

1. **Build phase**: scan all `.java`/`.kt`/`.scala` files in the perimeter.
   For each file, extract the package declaration + top-level class/interface
   names. Build an index: `org.apache.spark.sql.Dataset` → `repo:apache-spark`.

2. **Resolve phase**: for each `import` statement in each file, look up the
   fully-qualified name in the index. If found → `references` edge from the
   importing unit to the defining unit. If not found → external node + edge.

3. **Complexity**: O(files × classes-per-file) to build, O(1) per import
   lookup. Practical for thousands of files.

## Edge semantics

- `references` edges are STRUCTURAL (code-level), not dependency (manifest).
- Evidence state: `metadata-visible` (parsed from source, not verified at
  runtime).
- An import that matches a manifest `depends-on` target does NOT replace the
  manifest edge — both exist, with different evidence.
- Star imports (`import org.apache.spark.sql.*`) resolve to the package's
  defining unit if all classes in that package belong to one unit; otherwise
  they are ambiguous and recorded as `not_assessed`.

## Language coverage

- `.java`: `import x.y.Z;` (semicolon-terminated, package declaration at top)
- `.kt`: `import x.y.Z` (no semicolon), package declaration
- `.scala`: `import x.y.Z` (no semicolon), package declaration

All three use the dotted-FQN convention, so one resolver handles all three.

## Relationship to existing Go reference detection

The Go core already detects Go-level `references` from symbol-index role data
(`internal/maprun/symbolrefs.go`). This change adds JVM source references as
a parallel path — same edge vocabulary, different source language.

## Status

Design proposal. The file-scanning approach (full scan vs. sampling), star-
import handling, and performance budget are implementation-TBD.

## Reversibility

High. Additive edge detection; absent JVM files yield no edges (honest-empty).
