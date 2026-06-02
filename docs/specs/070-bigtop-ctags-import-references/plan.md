# Implementation Plan: Bigtop Ctags Import References

**Branch**: `codex/070-bigtop-ctags-import-references`

**Spec**: `docs/specs/070-bigtop-ctags-import-references/spec.md`

## Summary

Use installed Universal Ctags 6.2.1 with reference extras to extract Java/Go
package import reference roles for the same 15 selected Bigtop targets used by
spec 059. Record the result as bounded `source-visible` Java/Go
import-reference evidence, not as a full symbol/reference graph.

## Decision Gate

- **Simpler/Faster**: Stop at spec 069's conclusion that C6 is partial.
  Rejected because the installed ctags binary can safely produce a real
  reference-role supplement without new dependencies or target mutation.
- **Blocking Edge Cases**: Universal Ctags Java/Go package import roles are not
  method/class references and do not resolve call edges. They also exclude C/C++
  includes, Python imports, shell sourcing, and language surfaces not emitted by
  this ctags configuration. They improve C6 beyond definitions-only evidence
  but cannot verify full symbol/reference graph or enterprise parity.
- **Existing Open Source**: Use installed Universal Ctags 6.2.1. Do not install
  SCIP, CodeQL, JDTLS, LSIF, srcML, or other indexers in this slice because that
  would introduce a new tooling/network/build boundary requiring separate
  approval and design.

## Scope

In scope:

- Reuse spec 059 selected target paths.
- Run Universal Ctags with `--extras=+r`.
- Record role support, summary counts, hashes, and sizes.
- Run Cursor claim-boundary stress.
- Run three assessed independent non-GPT review lanes.

Out of scope:

- Builds.
- Runtime capture.
- New tool installation.
- Portolan importer code.
- Full def/ref or call graph claims.

## External Outputs

External output root:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-070-ctags-import-references/tool-outputs/
```

Key files:

- `selected-target-paths.txt`
- `ctags-version.txt`
- `ctags-java-roles.txt`
- `ctags-go-roles.txt`
- `bigtop-selected-import-roles.jsonl`
- `imported-references.tsv`
- `import-role-summary.json`
- `imported-references-by-repo.txt`
- `top-imported-packages.txt`
- `sha256.txt`
- `sizes.txt`
- `universal-ctags.exit-code`
- `universal-ctags.stderr`
- `universal-ctags.stdout`

## Producer Command

```bash
ctags -R --output-format=json --fields=+Klnr --extras=+r \
  --languages=Java,Go --kinds-Java=p --kinds-Go=p \
  -f "$OUT/bigtop-selected-import-roles.jsonl" $(cat "$OUT/selected-target-paths.txt")
```

## Producer Results

verified:

- Universal Ctags version: 6.2.1.
- Exit code: `0`.
- Total JSON records: 936,748.
- Tag records: 936,715.
- Imported reference records: 873,435.
- Unique importing files: 59,704.
- Languages: Java 935,829 tags; Go 886 tags.
- Kind: package 936,715 tags.
- Roles: `imported` 873,435; `def` 63,280.

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

Per-repo imported reference counts:

```text
184402 apache-flink
182126 apache-hadoop
109817 apache-hive
90226 apache-hbase
87092 apache-kafka
56105 apache-solr
41671 apache-phoenix
39379 alluxio
```

## Evidence Boundary

verified:

- Bounded package import-reference evidence exists for the selected Bigtop
  scope.

partial:

- C6 symbol/reference graph improves beyond definitions-only evidence.

cannot_verify:

- Full method/class symbol references.
- Call graph.
- Runtime topology.
- Human/enterprise architecture parity.

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
