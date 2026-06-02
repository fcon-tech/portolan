# Ctags Import Reference Ledger: Spec 070

Date: 2026-06-02
Branch: `codex/070-bigtop-ctags-import-references`
External output root:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-070-ctags-import-references/tool-outputs`

## Tool And Scope

verified:

- Universal Ctags 6.2.1 is installed at `/home/linuxbrew/.linuxbrew/bin/ctags`.
- Host environment: Linux WSL2
  `6.6.87.2-microsoft-standard-WSL2`, shell `zsh`.
- Java roles include package role `imported`.
- Go roles include package role `imported`.
- The run reused the 15 selected target paths from spec 059:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-059-symbol-reference-producer/tool-outputs/selected-target-paths.txt`.
  The file was copied byte-for-byte into this slice's external output root as
  `selected-target-paths.txt`; no new selection logic was applied.

Selected target repositories:

```text
alluxio
apache-airflow
apache-bigtop-repo
apache-flink
apache-hadoop
apache-hbase
apache-hive
apache-kafka
apache-phoenix
apache-ranger
apache-solr
apache-spark
apache-tez
apache-zeppelin
apache-zookeeper
```

Target repository heads and dirty counts at producer-run review time:

```text
alluxio	3f21b2d	0
apache-airflow	5978911	0
apache-bigtop-repo	19a1c92	0
apache-flink	45295cf6	0
apache-hadoop	46d02ca2	0
apache-hbase	6983e2d	0
apache-hive	d2d7dd22	0
apache-kafka	fa097fa	0
apache-phoenix	225cf0e	0
apache-ranger	d1589d6	0
apache-solr	3aa6aa2	0
apache-spark	d61dae7a	0
apache-tez	330fdc8	0
apache-zeppelin	1a6a8e3	0
apache-zookeeper	34a9492	0
```

The third column is the count of `git status --short` rows for that target
repository.

## Language Scope

This slice intentionally limits ctags extraction to Java and Go package roles.
That matches the installed Universal Ctags role support inspected for this
slice and the dominant JVM-heavy C6 gap from specs 064 and 069.

Excluded and still `cannot_verify` in this slice:

- C/C++ `#include` references.
- Python imports.
- Shell `source` or command references.
- Scala/Kotlin/Groovy references not emitted by this ctags configuration.
- Method/class/field references and call graph.

## Producer Command

```bash
ctags -R --output-format=json --fields=+Klnr --extras=+r \
  --languages=Java,Go --kinds-Java=p --kinds-Go=p \
  -f "$OUT/bigtop-selected-import-roles.jsonl" $(cat "$OUT/selected-target-paths.txt")
```

The first attempted command omitted `-R` and produced only pseudo tags. That
output was overwritten before the final producer summary. The final command
above is the assessed producer run.

## Producer Result

verified:

- Exit code: `0`.
- Stderr contains only Universal Ctags TOML/Cargo subparser warnings.
- Stdout is empty.
- Total JSON records: 936,748.
- Tag records: 936,715.
- Non-tag pseudo/header records: 33.
- Imported reference records: 873,435.
- Unique importing files: 59,704.
- Role counts:
  - `imported`: 873,435
  - `def`: 63,280
- Language counts:
  - Java: 935,829
  - Go: 886
- Kind counts:
  - package: 936,715

Cross-check:

```text
873435 imported + 63280 def = 936715 tag records
```

The `def` records are direct Universal Ctags package-role output for package
declarations. They are excluded from this slice's import-reference claim and
are not counted as method/class symbol definitions.

The 33 non-tag pseudo/header records are ctags metadata records, grouped as:

```text
JSON_OUTPUT_VERSION 1
TAG_EXTRA_DESCRIPTION 5
TAG_FIELD_DESCRIPTION 11
TAG_FILE_SORTED 1
TAG_KIND_DESCRIPTION 2
TAG_OUTPUT_EXCMD 1
TAG_OUTPUT_FILESEP 1
TAG_OUTPUT_VERSION 1
TAG_PARSER_VERSION 2
TAG_PATTERN_LENGTH_LIMIT 1
TAG_PROC_CWD 1
TAG_PROGRAM_AUTHOR 1
TAG_PROGRAM_NAME 1
TAG_PROGRAM_URL 1
TAG_PROGRAM_VERSION 1
TAG_ROLE_DESCRIPTION 2
```

Top imported packages:

```text
18950 java.util.List
17778 java.io.IOException
13645 java.util.Map
11471 org.slf4j.Logger
11125 org.slf4j.LoggerFactory
10497 java.util.ArrayList
10049 org.junit.jupiter.api.Test
8391 org.apache.hadoop.conf.Configuration
6956 java.util.HashMap
6459 java.util.Arrays
```

Imported reference counts by repository:

```text
184402 apache-flink
182126 apache-hadoop
109817 apache-hive
90226 apache-hbase
87092 apache-kafka
56105 apache-solr
41671 apache-phoenix
39379 alluxio
30562 apache-ranger
19653 apache-tez
11750 apache-zookeeper
9805 apache-zeppelin
9272 apache-spark
1238 apache-bigtop-repo
337 apache-airflow
```

## Output Integrity

Key hashes from `sha256.txt`:

```text
18a4666dccc4bbea9cf457e88a537c90366983b4c59995dc60938ad78fbaeca5  bigtop-selected-import-roles.jsonl
8af8c8896f566d2909c0c22fb04966110808223a3e63c85eb434e98c9a02e93d  import-role-summary.json
74274da58589ef5ae09f275cb31d9c602692a02cf9cd4054ca5af60710f93ebf  imported-references.tsv
9ccc1392aeb297c6be76073d93b06b3bf42e4409c741f41bde72dadc335b04d8  imported-references-by-repo.txt
6c6bef04553530efe139d228bdd4edf9c834489c0d1bb9a846bfb19eddefbb53  top-imported-packages.txt
9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa  universal-ctags.exit-code
a5be68bf4c392893a98734661f8bd80aba271525a5f1ebd7d807d8173ad0aa62  universal-ctags.stderr
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  universal-ctags.stdout
```

Key sizes from `sizes.txt`:

```text
359193030 bigtop-selected-import-roles.jsonl
458 import-role-summary.json
187592656 imported-references.tsv
248 imported-references-by-repo.txt
1815 top-imported-packages.txt
2 universal-ctags.exit-code
138 universal-ctags.stderr
0 universal-ctags.stdout
```

Raw JSONL and TSV outputs are intentionally not committed because they are large
external stress outputs under the Bigtop landscape.

## Evidence Decision

verified:

- Bounded import-reference producer output exists for the selected Bigtop
  scope.
- This improves C6 beyond definitions-only ctags evidence from spec 059.

partial:

- C6 symbol/reference graph. Package import references are real references, but
  they are not method/class references and do not resolve call edges.

cannot_verify:

- Full symbol/reference graph.
- Call graph.
- Runtime topology.
- Human/enterprise code-intelligence parity.

## Boundary

- No Bigtop service was started.
- No Kubernetes cluster was contacted.
- No Bigtop repository was built.
- No target repository mutation was performed.
- No new indexer was installed.
- Output was written only to the external `$OUT` stress directory under
  `.portolan/stress`, outside the selected target repositories.
- No network-dependent tooling was added.
