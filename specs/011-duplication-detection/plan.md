# Implementation Plan: Duplication Detection

## Decision Gate

- Simpler/Faster: implement a deterministic exact source/config file duplicate
  detector in Go and keep richer copy/paste detection in the OSS/jscpd path.
- Blocking Edge Cases: near-clone detection, AST-aware similarity, generated
  code, vendored dependencies, huge files, and binary content can create noisy
  or privacy-heavy results. The native detector must skip or degrade those
  surfaces honestly.
- Existing Open Source: jscpd is the mature local OSS option for clone
  detection. Portolan should not reimplement it in this slice; it should import
  existing jscpd output or guide agents through `oss-plan.json`.

## Technical Approach

- Add an internal exact-duplicate detector for candidate source and config
  files.
- Skip `.portolan`, `.git`, dependency/vendor/build directories, lockfiles,
  generated files, binary files, and files above a small bounded size.
- Normalize line endings and surrounding whitespace, hash content, and emit a
  cluster only when two or more files have the same normalized content.
- Emit machine-readable duplication graph nodes and findings from `portolan map`
  with file-level evidence pointers and neutral language.
- Preserve the existing `not_assessed` placeholder when no supported duplicate
  cluster is observed.

## Verification

Run:

```bash
go test ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan map --root testdata/duplication-detection/repo --out /tmp/portolan-011-duplication --force
while IFS= read -r line; do printf '%s\n' "$line" | jq empty; done </tmp/portolan-011-duplication/findings.jsonl
```
