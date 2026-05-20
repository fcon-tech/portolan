# Slice 1 Review Disposition

Date: 2026-05-20
Spec: `specs/005-black-box-profile/`
Slice: fixtures, selection model, black-box normalization, scan integration,
packet wording, docs, and task/status ledgers.

## Local Verification

- verified: `go test -count=1 ./...`
- verified: `jq empty schema/*.json`
- verified: `go run ./cmd/portolan scan --selection testdata/black-box-profile/selection.json --out /tmp/portolan-black-box-graph.json --force`
- verified: `jq empty /tmp/portolan-black-box-graph.json`
- verified: `go run ./cmd/portolan packet render --graph /tmp/portolan-black-box-graph.json --out /tmp/portolan-black-box-packet.md --force`
- verified: `git diff --check`

## Review Lanes

### Local repo-grounded review

Result: accepted findings from pre-implementation review were fixed.

- Selection parser and schema now include `black_boxes[]`.
- Black-box normalization emits `metadata-visible`, `runtime-visible`,
  `claim-only`, `unknown`, and `cannot_verify` without `source-visible`.
- Packet output now includes metadata-visible and runtime-visible sections.
- Status and task ledgers were updated after implementation.

### `kimi-coding/kimi-for-coding`

Result: completed, degraded by initial invalid tool-call attempt.

Findings:

- major: black-box validation error paths lacked tests.
- minor: claim-only wiring lacked a targeted assertion.
- minor: malformed metadata was not covered.
- minor: schema example validation was not covered.

Disposition:

- accepted/fixed: validation error-path tests added in `internal/app/app_test.go`.
- accepted/fixed: targeted claim-only dependency assertion added.
- accepted/fixed: malformed metadata and malformed claim tests added.
- accepted-narrower: schema syntax is covered by `jq empty schema/*.json`; full
  JSON Schema validation remains not_assessed because the repo has no schema
  validation harness in this slice.

### `minimax/MiniMax-M2.7`

Result: completed, degraded by initial invalid tool-call attempt and incomplete
diff visibility for untracked files.

Findings:

- major: malformed metadata/claim inputs lacked tests.
- major: black-box selection validation error paths lacked tests.
- minor: packet edge wording was not asserted.
- minor: node/edge count assertion was broad.

Disposition:

- accepted/fixed: malformed metadata/claim tests added.
- accepted/fixed: black-box selection validation rejection tests added.
- accepted/fixed: packet relationship wording assertions added.
- rejected: exact graph count assertion is not required because duplicate
  metadata and claim facts are intentionally allowed until multi-evidence merge
  semantics exist.

### `zai/glm-5.1`

Result: completed, degraded by incomplete diff visibility for untracked files.

Findings:

- major: schema reused generic `input_source` for `black_box.claims` instead of
  a claim-source-specific definition.
- minor: validation tests were missing.
- minor: packet edge wording needed assertion.

Disposition:

- accepted/fixed: `schema/selection.schema.json` now defines `claim_source` and
  uses it for top-level and black-box claim arrays.
- accepted/fixed: validation tests added.
- accepted/fixed: packet edge wording assertions added.

## Remaining Risk

- not_assessed: full JSON Schema validation against fixtures. Current baseline
  only checks schema JSON syntax with `jq empty`.
- not_assessed: GitHub PR checks and PR review workflow; no PR has been created
  in this slice yet.
