# Producer Run Ledger: Spec 059

Date: 2026-06-02
Target root: `/home/fall_out_bug/projects/bigtop-landscape`
Stress root: `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-059-symbol-reference-producer`

## Acquisition

| ID | Tool | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| `producer-acquisition-universal-ctags-20260602` | Universal Ctags | verified | Homebrew installed `universal-ctags` `6.2.1` under `/home/linuxbrew/.linuxbrew/Cellar/universal-ctags/6.2.1` | User-local package manager install; target repositories were not mutated. |

## Producer Run

| ID | Family | Tool / version | Status | Evidence state | Scope | Output | Validation | Privacy review | Limitations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `producer-run-bigtop-selected-universal-ctags-20260602` | symbol definitions | Universal Ctags `6.2.1` | verified | metadata-visible | 15 selected Bigtop targets from `selection.json`; excludes `.git`, `target`, `build`, `.gradle`, and `node_modules` | `tool-outputs/bigtop-selected-universal-ctags.jsonl` | exit 0; 5,390,732 JSONL tag records; 93,380 unique files; `bad_json_lines=0`; head JSON validation passed; automated role check found 0 `ref` or `call` role tags | output remains external under local stress root; committed ledger stores summary only; no credentials read; target repo mutation audit found `git status --short` count 0 for all 15 selected repos | Definitions-focused tags output. This is broad symbol definition evidence, not a full definition/reference graph. Runtime topology remains not_assessed. |

## Summary

`ctags-summary.json` records:

- total tags: 5,390,732
- bad JSON lines: 0
- unique files: 93,380
- top languages: Java, JSON, Python, JavaScript, C++, SQL, CSS, PHP, R,
  Markdown, TypeScript, ReStructuredText, Protobuf, Ruby, XML, JavaProperties,
  Go, Kotlin, Asciidoc, SVG, HTML, C, Maven2, Thrift, Sh
- top roles: `def` for 5,390,211 tags
- role check: 0 `ref` or `call` role tags; classification `definitions-only`
- raw output size: 2.2G

## Classification

This run moves C6 from selected-file symbol listing to broad selected-scope
symbol definitions. It still does not verify full symbol/reference graph because
Universal Ctags output is definitions-focused and does not provide call-site,
use-site, or cross-repo reference edges.

## Warnings

`universal-ctags.stderr` contains parser warnings/notices, including Puppet
manifest operand-stack warnings and ignored null JavaScript/XML tags. These do
not make the producer run fail, but they limit completeness for affected files.

## Target Mutation Audit

`target-git-status-counts.tsv` records `git status --short` count `0` for all
15 selected target repositories after the producer run.

## Retention

The raw `bigtop-selected-universal-ctags.jsonl` file is intentionally kept
outside the Portolan repository under the local Bigtop stress root. It is a large
2.2G local artifact and may contain source-adjacent patterns, paths, and symbol
names. Commit only summaries and ledgers.
