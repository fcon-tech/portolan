# Tasks: OSS Agent Context Assembly

## Implementation

- [x] T001 Add focused tests for `portolan context prepare` help and artifact
  output.
- [x] T002 Add bounded repository discovery for root, direct children, and
  `repos/*`.
- [x] T003 Add local OSS/tool-output candidate detection and gap records.
- [x] T004 Generate `agent-brief.md`, `query-plan.md`, `repos.json`,
  `tool-registry.json`, `oss-plan.json`, and `gaps.jsonl`.
- [x] T005 Wire the command through `internal/app` without moving behavior into
  `cmd/portolan`.
- [x] T006 Update agent docs or Cursor rules only where they reference the old
  primary workflow.

## Verification

- [x] T007 Run `go test ./...`.
- [x] T008 Run `jq empty schema/*.json`.
- [x] T009 Run `git diff --check`.
- [x] T010 Run `go run ./cmd/portolan context prepare --help`.
