# Ctags Cross-Language Reference Ledger: Spec 071

Date: 2026-06-02
Branch: `codex/071-bigtop-ctags-cross-language-imports`
External output root:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-071-ctags-cross-language-imports/tool-outputs`

## Tool And Scope

verified:

- Universal Ctags 6.2.1 is installed at `/home/linuxbrew/.linuxbrew/bin/ctags`.
- Role support was recorded for C, C++, Python, and Sh.
- The run reused the 15 selected target paths from spec 059.
- No new selection logic was applied.

## Producer Command

```bash
ctags -R --output-format=json --fields=+Klnr --extras=+r \
  --languages=C,C++,Python,Sh \
  -f "$OUT/bigtop-selected-cross-language-imports.jsonl" \
  $(cat "$OUT/selected-target-paths.txt")
```

## Producer Result

verified:

- Exit code: `0`.
- Stderr contains only Universal Ctags TOML/Cargo subparser warnings.
- Stdout is empty.
- Total JSON records: 347,610.
- Tag records: 347,522.
- Non-tag pseudo/header records: 88.
- Reference-role records: 147,472.
- Unique reference files: 8,432.
- Language counts:
  - C: 4,823
  - C++: 45,983
  - Python: 294,256
  - Sh: 2,460
- Key reference-role counts:
  - `imported`: 87,115
  - `namespace`: 51,707
  - `indirectlyImported`: 3,518
  - `system`: 2,779
  - `local`: 1,764
  - `loaded`: 153
  - `endmarker`: 234
  - `undef`: 202

Top role/language/kind combinations:

```text
74674 Python	unknown	imported
51707 Python	module	namespace
12441 Python	module	imported
1976 C++	header	system
1771 Python	unknown	indirectlyImported
1747 Python	module	indirectlyImported
1183 C++	header	local
803 C	header	system
581 C	header	local
234 Sh	heredoc	endmarker
169 C++	macro	undef
153 Sh	script	loaded
33 C	macro	undef
```

Interpretation notes:

- `Python unknown imported` records are ctags-import records where Universal
  Ctags identifies an imported Python name but does not resolve the imported
  target's semantic type. They are valid source-visible reference-role records,
  not type-resolution or cross-reference evidence.
- `Python module namespace` records represent namespace/module context emitted
  by Universal Ctags. They contribute to bounded source-visible reference-role
  evidence, but they are not import-call edges or resolved def/use links.
- C/C++ `header system` and `header local` records are include/header reference
  roles. They are not function/method references.
- Shell `script loaded` records are source-visible loaded-script references,
  not runtime execution evidence.

Scope check:

```text
reference_records_checked 147472
selected_roots 15
outside_selected_roots 0
```

Every reference-role record path in `cross-language-reference-tags.tsv` falls
under one of the 15 selected target roots inherited from spec 059.

Reference counts by repository:

```text
107054 apache-airflow
24928 apache-spark
5453 apache-flink
3980 apache-hadoop
2208 apache-kafka
874 apache-ranger
754 apache-zookeeper
604 apache-hive
441 apache-bigtop-repo
325 apache-solr
299 apache-hbase
212 apache-zeppelin
175 alluxio
118 apache-phoenix
47 apache-tez
```

## Output Integrity

Key hashes:

```text
d742567dadac83db910f3484e12fd461ae687df7a88c34c47564878591fd585a  bigtop-selected-cross-language-imports.jsonl
e97b8ecd1df30c3dfdf3165783977b94e63d3ada09873c895a16db7bbf1d2333  cross-language-reference-summary.json
ea5c29e56cf06cde5e5f1081c6df7634f45145a19ee33cdc5786370b08620b20  cross-language-reference-tags.tsv
```

Key sizes:

```text
128472922 bigtop-selected-cross-language-imports.jsonl
2094 cross-language-reference-summary.json
25411651 cross-language-reference-tags.tsv
```

Raw JSONL and TSV outputs are intentionally not committed because they are large
external stress outputs under the Bigtop landscape.

## Evidence Decision

verified:

- Bounded C/C++/Python/Sh reference-role producer output exists for the
  selected Bigtop scope.
- This extends spec 070 beyond Java/Go package import references.
- The output is bounded source-visible cross-language reference-role evidence
  only; it does not constitute a full C6 symbol/reference graph.

partial:

- C6 symbol/reference graph. These are real source-visible reference roles, but
  they are not cross-resolved symbol references or call graph evidence.

cannot_verify:

- Full symbol/reference graph.
- Method/class reference edges.
- Cross-reference resolution.
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
