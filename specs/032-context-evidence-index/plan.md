# Plan: Context Evidence Index

## Decision Gate

- Simpler/Faster: Add a JSONL index over existing context-preparation outputs;
  do not add a new scanner, storage layer, search daemon, or OSS execution
  step.
- Blocking Edge Cases: Large landscapes need bounded first-pass records; private
  source must not be copied; missing or malformed evidence must stay
  `unknown`, `cannot_verify`, or `not_assessed`.
- Existing Open Source: Repomix, aider repo maps, Serena, Sourcebot, OpenGrok,
  and Zoekt are useful adjacent patterns for large-codebase navigation. This
  slice only links existing Portolan context artifacts, so a new dependency is
  not justified.

## Implementation

1. Add an internal `EvidenceRecord` model under context preparation.
2. Build records from discovered repositories, detected tool outputs, and gap
   records.
3. Write `evidence-index.jsonl` into the context pack.
4. Update help, generated Markdown, portable agent docs, Cursor rule, and MVP
   docs.
5. Add focused app tests for the new artifact and record families.

## Verification

- `go test -count=1 ./internal/app`
- `go test -count=1 ./...`
- `jq empty schema/*.json testdata/oss-adapter-contract/*.json`
- `git diff --check`
- `go run ./cmd/portolan context prepare --root <fixture> --out <dir> --profile cursor --force`
