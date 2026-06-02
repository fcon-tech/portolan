# Implementation Plan: Bigtop Existing Artifact Jdeps

**Branch**: `codex/072-existing-artifact-jdeps`

**Spec**: `docs/specs/072-existing-artifact-jdeps/spec.md`

## Summary

Use installed `jdeps` 26.0.1 to analyze existing `.jar` and `.class` artifacts
already present under the 15 selected Bigtop target roots. The slice records
bounded compiled-artifact dependency evidence and keeps runtime topology, full
symbol/reference graph, call graph, and enterprise parity as `cannot_verify`.

## Decision Gate

- **Simpler/Faster**: Stop after ctags import/reference slices from specs 070
  and 071. Rejected because existing compiled JVM artifacts can be assessed
  read-only with `jdeps`, adding real JVM package dependency evidence without a
  build or new indexer.
- **Blocking Edge Cases**: The discovered artifacts are mostly test/resource
  jars plus tiny Hive/Bigtop artifacts. `jdeps` can expose package/module
  dependencies and unresolved packages, but it does not provide source-level
  references, cross-reference resolution, call graph, runtime topology, or
  representative full Bigtop coverage. Most dependency rows come from bundled
  third-party test fixtures, not Bigtop-compiled production outputs.
- **Existing Open Source**: Use installed JDK `jdeps` 26.0.1. It is the standard
  JDK dependency analyzer, local-only for supplied artifacts, and avoids adding
  a new dependency or scanner. Full graph tools remain out of scope because they
  require installation, build outputs, or broader setup.

## Scope

In scope:

- Existing `.jar` and `.class` discovery under the selected 15 Bigtop roots.
- `jdeps` runs over those existing artifacts only.
- Artifact/module/package row summaries.
- Cursor claim-boundary stress.
- Three assessed independent non-GPT review lanes.

Out of scope:

- Builds.
- Runtime capture.
- New tool installation.
- Portolan importer code.
- Full def/ref or call graph claims.

## Producer Command

The producer run is recorded externally at:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-072-existing-artifact-jdeps/tool-outputs/
```

The effective command used installed `jdeps` over each artifact listed in the
external `existing-java-artifacts.tsv`:

```bash
JDEPS=/home/linuxbrew/.linuxbrew/bin/jdeps
"$JDEPS" -verbose:package "$artifact"
```

## Producer Results

verified:

- `jdeps` version: 26.0.1.
- Existing artifacts assessed: 9.
- Repositories with artifacts: Apache Zeppelin 5, Apache Hive 3,
  Apache Bigtop repo 1.
- Evidence-producing artifacts: 8; `cachedir.jar` exited `0` but emitted no
  dependency rows.
- Exit code: `0` for all 9 assessed artifacts.
- Stderr bytes: `0` for all 9 assessed artifacts.
- Dependency rows: 289.
- Unresolved `not found` rows: 16.
- Raw combined output lines: 329.
- External hash for `jdeps-all-output.txt`:
  `06b057daeb5b2dc05d56766b93f405b1d81e8e20d3772810901152854cc03b16`.
- Coverage qualifier: the artifact set is dominated by third-party
  test/resource jars in Zeppelin and tiny Hive UDF fixtures. Row counts reflect
  package/module wiring inside those already-present artifacts, not Bigtop
  production architecture.

Per-artifact dependency rows:

```text
190  4  apache-zeppelin/zeppelin-server/src/test/resources/log4j-1.2.17.jar
48   0  apache-zeppelin/zeppelin-server/src/test/resources/gson-2.2.jar
21   4  apache-zeppelin/zeppelin-server/src/test/resources/commons-logging-1.1.1.jar
16   1  apache-zeppelin/zeppelin-server/src/test/resources/slf4j-api-1.7.10.jar
8    4  apache-zeppelin/zeppelin-server/src/test/resources/slf4j-log4j12-1.7.10.jar
2    1  apache-hive/itests/hive-unit/testUdf/DummyUDF.jar
2    1  apache-hive/itests/hive-unit/testUdf/DummyUDF.class
2    1  apache-hive/data/files/identity_udf.jar
0    0  apache-bigtop-repo/bigtop-tests/test-artifacts/hadoop/src/main/resources/cachedir.jar
```

Top dependency containers/modules reported by `jdeps`:

```text
141 java.base
63  log4j-1.2.17.jar
28  java.desktop
17  gson-2.2.jar
16  not found
11  java.xml
5   slf4j-api-1.7.10.jar
```

## Evidence Boundary

verified:

- Bounded existing-artifact JVM package/module dependency evidence exists for a
  small artifact set already present under selected Bigtop targets. This is
  beyond Syft/CycloneDX and ctags-only source tagging only for the narrow
  compiled-artifact scope assessed here.

partial:

- C6 is stronger because JVM compiled-artifact dependency rows exist in addition
  to ctags definition/import/reference evidence.

cannot_verify:

- Full source-level symbol/reference graph.
- Method/class/type source references.
- Cross-reference resolution.
- Call graph.
- Runtime topology.
- Human/enterprise architecture parity.

## Verification

```bash
# Run from the Portolan repo root.
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
