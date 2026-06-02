# Implementation Plan: Bigtop Ctags Cross-Language Imports

**Branch**: `codex/071-bigtop-ctags-cross-language-imports`

**Spec**: `docs/specs/071-bigtop-ctags-cross-language-imports/spec.md`

## Summary

Use installed Universal Ctags 6.2.1 with reference extras to extract bounded
C/C++ header, Python import/namespace, and shell loaded-script reference roles
for the same 15 selected Bigtop targets used by specs 059 and 070.

## Decision Gate

- **Simpler/Faster**: Stop after Java/Go import references from spec 070.
  Rejected because ctags already supports additional reference roles for
  languages explicitly called out as excluded by the spec 070 review.
- **Blocking Edge Cases**: Ctags reference roles for headers/imports/scripts are
  source-visible references, not cross-resolved symbol references, method/class
  usages, or call graph. They improve C6 breadth but cannot verify full C6 or
  enterprise parity.
- **Existing Open Source**: Use installed Universal Ctags 6.2.1. Do not install
  a full indexer in this slice.

## Scope

In scope:

- C and C++ header roles.
- Python module/unknown import and namespace roles.
- Shell loaded script and heredoc roles.
- Cursor claim-boundary stress.
- Three assessed independent non-GPT review lanes.

Out of scope:

- Builds.
- Runtime capture.
- New tool installation.
- Portolan importer code.
- Full def/ref or call graph claims.

## Producer Command

```bash
ctags -R --output-format=json --fields=+Klnr --extras=+r \
  --languages=C,C++,Python,Sh \
  -f "$OUT/bigtop-selected-cross-language-imports.jsonl" \
  $(cat "$OUT/selected-target-paths.txt")
```

## Producer Results

verified:

- Universal Ctags version: 6.2.1.
- Exit code: `0`.
- Total JSON records: 347,610.
- Tag records: 347,522.
- Reference-role records: 147,472.
- Unique reference files: 8,432.
- Languages: C 4,823; C++ 45,983; Python 294,256; Sh 2,460.
- Key reference roles:
  - `imported`: 87,115
  - `namespace`: 51,707
  - `indirectlyImported`: 3,518
  - `system`: 2,779
  - `local`: 1,764
  - `loaded`: 153

Top repository counts:

```text
107054 apache-airflow
24928 apache-spark
5453 apache-flink
3980 apache-hadoop
2208 apache-kafka
```

## Evidence Boundary

verified:

- Bounded cross-language reference-role evidence exists for the selected Bigtop
  scope.

partial:

- C6 symbol/reference graph improves beyond Java/Go-only package import
  references.

cannot_verify:

- Full method/class symbol references.
- Cross-reference resolution.
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
