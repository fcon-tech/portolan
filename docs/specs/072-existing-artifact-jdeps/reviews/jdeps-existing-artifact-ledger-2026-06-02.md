# Jdeps Existing Artifact Ledger

Date: 2026-06-02
Branch: `codex/072-existing-artifact-jdeps`

## External Output Root

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-072-existing-artifact-jdeps/tool-outputs/
```

## Tool

verified:

- `jdeps` path: `/home/linuxbrew/.linuxbrew/bin/jdeps`
- `jdeps` version: 26.0.1.
- The run used `jdeps -verbose:package` against existing artifacts only.

## Selected Scope

verified:

- Selected roots were reused from spec 059:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-059-symbol-reference-producer/tool-outputs/selected-target-paths.txt`.
- Existing artifact discovery found 9 artifacts under selected roots.
- Artifact distribution: Apache Zeppelin 5, Apache Hive 3,
  Apache Bigtop repo 1.
- Path validation found all 9 assessed artifacts are regular files under the
  selected roots; none of the assessed artifacts were symlinks.
- Provenance qualifier: the set is dominated by bundled third-party
  test/resource jars and tiny UDF fixtures, not Bigtop-compiled production
  artifacts.

Artifacts:

```text
489884 apache-zeppelin/zeppelin-server/src/test/resources/log4j-1.2.17.jar
189612 apache-zeppelin/zeppelin-server/src/test/resources/gson-2.2.jar
60686  apache-zeppelin/zeppelin-server/src/test/resources/commons-logging-1.1.1.jar
32119  apache-zeppelin/zeppelin-server/src/test/resources/slf4j-api-1.7.10.jar
8866   apache-zeppelin/zeppelin-server/src/test/resources/slf4j-log4j12-1.7.10.jar
837    apache-hive/itests/hive-unit/testUdf/DummyUDF.jar
710    apache-hive/data/files/identity_udf.jar
585    apache-bigtop-repo/bigtop-tests/test-artifacts/hadoop/src/main/resources/cachedir.jar
532    apache-hive/itests/hive-unit/testUdf/DummyUDF.class
```

## Results

verified:

- Assessed artifacts: 9.
- `jdeps` exit code: `0` for all 9.
- Stderr bytes: `0` for all 9.
- Raw combined output lines: 329.
- Package dependency rows: 289.
- Unresolved `not found` rows: 16.
- At least 8 artifacts emitted package dependency rows; `cachedir.jar` emitted
  no dependency rows.
- `log4j-1.2.17.jar` alone contributes 190 of 289 dependency rows. The aggregate
  row count therefore reflects mostly third-party fixture bytecode wiring, not
  representative Bigtop stack architecture.

Per-artifact rows and unresolved rows:

```text
rows unresolved artifact
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
3   java.sql
2   commons-logging-1.1.1.jar
1   java.naming
1   java.management
1   java.logging
```

## Hashes

verified:

```text
06b057daeb5b2dc05d56766b93f405b1d81e8e20d3772810901152854cc03b16  jdeps-all-output.txt
988b9319c7980138af2fb71135ae5d470441eb18b1e27246a367e4e08e24d82b  jdeps-summary.tsv
df8995610f08873655511deadcaee20e165a4e5960298f6f5cb9c5c0c10f49d7  existing-java-artifacts.tsv
```

## Evidence Boundary

verified:

- This is real existing-artifact JVM package/module dependency evidence.
- It is beyond Syft/CycloneDX and beyond ctags-only source tagging only for this
  narrow compiled-artifact scope.
- It required no target build, no runtime start, no network fetch, and no new
  scanner installation.

partial:

- C6 is stronger for bounded JVM compiled-artifact dependency evidence.

cannot_verify:

- Full source-level symbol/reference graph.
- Source method/class/type references.
- Cross-reference resolution.
- Call graph.
- Runtime topology.
- Human/enterprise architecture parity.

## Allowed Wording

> `jdeps` 26.0.1 produced bounded package/module dependency evidence for 9
> existing JVM artifacts already present under selected Bigtop target roots:
> exit 0 for all artifacts, 289 package dependency rows, and 16 unresolved
> `not found` rows. The artifact set is dominated by bundled third-party
> test/resource jars and tiny UDF fixtures, not Bigtop production build output.

## Disallowed Wording

> Portolan has a full Bigtop JVM dependency graph.

> Portolan has a Bigtop source symbol/reference graph.

> Portolan has a Bigtop call graph.

> Portolan verifies Bigtop runtime topology.

> Portolan plus Cursor understands Bigtop like a human architect or enterprise
> code intelligence system.
