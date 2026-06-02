# Cursor Claim-Boundary Prompt: Ctags Import References

Run metadata:

- model: Cursor Agent `composer-2.5`
- branch: `codex/070-bigtop-ctags-import-references`
- execution_mode: `cursor-agent --print --mode ask --trust`

You are evaluating whether the new Universal Ctags import-reference producer
output changes the C6 and C9 assessment for Apache Bigtop architecture
understanding.

Do not browse the internet. Do not start services. Do not contact Kubernetes.
Do not treat package imports as method/class references or call graph.

Use these states:

- `verified`: directly checked producer output or command evidence.
- `partial`: bounded evidence exists but does not cover the full criterion.
- `source-visible`: evidence extracted from source files.
- `metadata-visible`: rendered config/descriptor/model metadata, not runtime.
- `runtime-visible`: observed live runtime state.
- `cannot_verify`: required evidence is absent or blocked.
- `not_assessed`: not checked in this packet.

## Prior State From Spec 069

- C3 static deployment-model evidence is verified bounded
  `metadata-visible`.
- C5 API/catalog/model surfaces are stronger but partial.
- C6 symbol/reference graph is partial because Universal Ctags definitions are
  broad but definitions-only.
- C4 runtime topology is `cannot_verify`.
- C9 human/enterprise architecture parity is `cannot_verify`.

## New Spec 070 Evidence

Universal Ctags 6.2.1 was run over the same 15 selected Bigtop target
repositories used by spec 059.

Producer command:

```bash
ctags -R --output-format=json --fields=+Klnr --extras=+r \
  --languages=Java,Go --kinds-Java=p --kinds-Go=p \
  -f "$OUT/bigtop-selected-import-roles.jsonl" $(cat "$OUT/selected-target-paths.txt")
```

Producer result:

- Exit code: `0`.
- Total JSON records: 936,748.
- Tag records: 936,715.
- Imported reference records: 873,435.
- Unique importing files: 59,704.
- Role counts:
  - `imported`: 873,435.
  - `def`: 63,280.
- Language counts:
  - Java: 935,829.
  - Go: 886.
- Kind counts:
  - package: 936,715.

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

Boundary:

- These are package import references extracted from source files.
- They are real reference-role producer output, but only for package imports.
- They are not method references.
- They are not class usage references beyond import declarations.
- They are not call graph.
- No Bigtop service was started.
- No Bigtop repository was built.
- No new indexer was installed.

## Required Output

Return:

1. Does this move C6 beyond definitions-only evidence?
2. Is C6 now verified full symbol/reference graph, or still partial?
3. What exact claim is allowed after this slice?
4. What claims remain disallowed?
5. Does this change C4 runtime topology or C9 enterprise parity?
6. What next evidence is required to verify full C6?

Be strict. Do not overclaim.
