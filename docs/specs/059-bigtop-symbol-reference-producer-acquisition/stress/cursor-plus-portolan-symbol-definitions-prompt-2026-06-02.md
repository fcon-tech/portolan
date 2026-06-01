# Cursor Plus Portolan Symbol Definitions Stress

You are Cursor Agent `composer-2.5` working in the local Bigtop landscape
workspace. Use the Portolan evidence summary below. Do not inspect or rely on
the full external 2.36GB ctags output directly; use the summarized evidence.

## Evidence Summary

Spec 059 acquired Universal Ctags `6.2.1` through Homebrew and ran it locally
against the 15 selected Bigtop targets from `selection.json`.

Producer run:

- ID: `producer-run-bigtop-selected-universal-ctags-20260602`
- family: symbol definitions
- output: `tool-outputs/bigtop-selected-universal-ctags.jsonl`
- total tags: 5,390,732
- unique files: 93,380
- bad JSON lines: 0
- dominant role: `def`
- top languages include Java, JSON, Python, JavaScript, C++, SQL, PHP,
  TypeScript, Protobuf, Go, Maven2, Thrift, and shell.

Boundary:

- This is broad selected-scope symbol definition evidence.
- It is not a full symbol/reference graph.
- It does not provide call-site, use-site, cross-repo reference, or runtime
  topology evidence.
- Bigtop runtime topology remains `not_assessed`.
- Enterprise code-intelligence parity remains `not_assessed`.

## Task

Update C6 in the C1-C9 parity rubric and answer:

1. What can Cursor plus Portolan now claim about Bigtop symbol evidence?
2. What must remain forbidden?
3. Does this change runtime topology?
4. Does this verify enterprise code-intelligence parity?

Required output:

A markdown table with columns `criterion`, `updated_status`, `allowed_claim`,
`forbidden_claim`, `remaining_gap`, followed by a one-sentence verdict.
