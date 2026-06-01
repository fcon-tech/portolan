# Def/Ref Producer Probe Ledger: Spec 064

Date: 2026-06-02
External output root:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-064-def-ref-producer-probe/tool-outputs`

## Tool Availability

verified:

```text
scip	not_found
codeql	not_found
srcml	not_found
lsif-java	not_found
lsif-go	not_found
src-cli	not_found
java-language-server	not_found
jdtls	not_found
ctags	found	/home/linuxbrew/.linuxbrew/bin/ctags
universal-ctags	not_found
gopls	found	/home/fall_out_bug/.local/bin/gopls
javap	found	/home/linuxbrew/.linuxbrew/bin/javap
jdeps	found	/home/linuxbrew/.linuxbrew/bin/jdeps
mvn	found	/home/linuxbrew/.linuxbrew/bin/mvn
gradle	not_found
```

Interpretation:

- Full def/ref indexer producers are absent in the current PATH:
  `scip`, `codeql`, `srcml`, `lsif-java`, `lsif-go`, `src-cli`,
  `java-language-server`, `jdtls`.
- `gradle` is absent from PATH even though 31 `build.gradle*` files exist; it
  is a build tool, not a def/ref indexer.
- Available tools are partial or adjacent:
  - `ctags`: definitions inventory, not references.
  - `gopls`: Go-only and already bounded to Airflow Go SDK in prior evidence.
  - `javap`/`jdeps`: require compiled classes/jars.
  - `mvn`: build tool, not a read-only def/ref exporter by itself.

## Build Artifact Probe

verified:

```text
pom.xml	203
build.gradle	31
target_classes_dirs	0
class_files	0
jar_files	1
```

Selected probe roots:

- `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-hadoop`
- `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-hbase`
- `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo`

The only jar found in selected scope:

```text
/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/bigtop-tests/test-artifacts/hadoop/src/main/resources/cachedir.jar
```

## jdeps Probe

verified:

- `jdeps` exit code for `cachedir.jar`: `0`.
- Output:

```text
$ jdeps cachedir.jar
```

Interpretation:

- The captured file is 21 bytes because it includes only the command header
  line shown above and no `jdeps` dependency rows.
- Exit code `0` confirms the local `jdeps` binary can run.
- No project-level def/ref evidence is inferred from that exit code.
- `cachedir.jar` is a test resource jar and does not provide meaningful
  project-level def/ref or dependency graph evidence.
- Because selected Hadoop/HBase/Bigtop repos have 0 compiled class files and 0
  `target/classes` directories, `jdeps` cannot produce project-level graph
  evidence without a build step.

## Output Integrity

`sha256.txt` records:

```text
f4fe76ff4f76efbfdf8cea86cc7ad2a17b6c94c656c9cc0b587886fcdc0beccd  build-artifact-summary.tsv
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  class-files.txt
773cc54ec096a3d7a73cad0ed3182e3bd04cf5a71609b783149e7f5917a8063d  def-ref-tool-availability.tsv
b0f9d3f9972789b9226c883cfd298b4de54cf118d9f974afd9a548e6ccda17e5  jar-files.txt
9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa  jdeps-cachedir-exit-code.txt
ceb9358da5944ae5ba06a1e1f1a04bbc9be60ae280f238bce7aa6b71907f2f59  jdeps-cachedir.txt
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  target-classes-dirs.txt
```

The empty-file hashes for `class-files.txt` and `target-classes-dirs.txt` are
expected SHA-256 values for zero-byte files. They verify that the probes ran and
found no `.class` files or `target/classes` directories in the selected scope.

`sizes.txt` records:

```text
  76 build-artifact-summary.tsv
   0 class-files.txt
 444 def-ref-tool-availability.tsv
 137 jar-files.txt
   2 jdeps-cachedir-exit-code.txt
  21 jdeps-cachedir.txt
1398 sha256.txt
   0 target-classes-dirs.txt
2078 total
```

## Claim Boundary

verified:

- The full def/ref producer blocker is now evidenced by both tool absence and
  compiled artifact absence for the selected probe scope.
- Findings apply only to the three selected probe roots:
  `apache-hadoop`, `apache-hbase`, and `apache-bigtop-repo`. Other Bigtop
  repositories were not probed for compiled artifacts in this slice.

cannot_verify:

- Full symbol/reference graph.
- Call graph.
- Enterprise code-intelligence parity.

blocked pending separate approval/tooling:

- Installing or enabling a full def/ref indexer.
- Building selected repos to produce class files/jars.
- Running build steps that fetch dependencies or execute target build logic.
