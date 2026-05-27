# Slice Review Disposition

## Scope

Implementation slice for `036-scope-completeness-validation`:

- coverage classification for selected local targets absent from a corpus
  manifest;
- `extra` schema/status support;
- weak coverage summary preservation;
- docs and SpecKit status alignment.

## Local Verification

- `go test -count=1 ./internal/coverage`: verified
- `go test -count=1 ./internal/app`: verified
- `go test -count=1 ./internal/maprun`: verified
- `go test -count=1 ./...`: verified
- `jq empty schema/*.json`: verified
- `git diff --check`: verified
- `go run ./cmd/portolan map --root <tmp fixture> --out <tmp> --force`:
  verified; `external-completeness` remained `unknown`.

## Independent Review Lanes

| Lane | Status | Notes |
| --- | --- | --- |
| `openrouter/deepseek/deepseek-v4-pro` | assessed | No major findings; minor reason/kind/weak-record clarity findings. |
| `openrouter/minimax/minimax-m2.7` | assessed | No major findings; minor test/assertion and backlog-timing findings. |
| `zai/glm-5.1` | assessed | Major finding for incorrectly confirming `extra` when the selected local path was missing; minor reason and weak-record notes. |
| focused DeepSeek re-review after fixes | not_assessed | Lane produced no output after repeated polls and the local process was terminated. |

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| REV-001 | major | Missing selected path absent from manifest was classified as `extra`, which overclaimed local evidence. | accepted/fixed; now becomes `cannot_verify` with `unknown` evidence state |
| REV-002 | minor | Extra record reason could duplicate itself in cannot-verify cases. | accepted/fixed with explicit reason strings |
| REV-003 | minor | `manifest-extra-*` kind sounded manifest-originated even though the record came from selected local scope. | accepted/fixed as `selected-extra-*` |
| REV-004 | minor | App-level test did not assert the extra record evidence state. | accepted/fixed |
| REV-005 | minor | `missing` weak-record behavior relied on evidence state rather than explicit status. | accepted/fixed |
| REV-006 | minor | Backlog status changed before PR/merge completion. | accepted narrower than stated; backlog now reflects local implementation status rather than merged completion |

## Residual Risk

- PR-level review and GitHub checks are not_assessed until a PR exists.
- Focused post-fix model re-review is degraded because the lane hung.
