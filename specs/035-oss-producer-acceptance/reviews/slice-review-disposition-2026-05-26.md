# Slice Review Disposition: OSS Producer Acceptance

## Scope

Review covered the spec-local producer acceptance artifacts and the narrow
`context prepare --force` behavior fix that preserves context-local
`tool-outputs/`.

## Local Review

- `accepted`: Preserve existing `<out>/tool-outputs/` regular files before
  replacing the context pack. This is required because the generated producer
  `after_run` command points producers at the context output directory and then
  reruns `context prepare --force`.
- `accepted`: Detect `<out>/tool-outputs/` during context preparation so
  reruns can mark producer output as `observed` and update `oss-plan.json` to
  `input_present`.
- `accepted`: Keep `jscpd` as `failed`, not verified, because the full default
  Bigtop run was interrupted before JSON output was written.
- `accepted`: Keep Semgrep as `not_assessed`, because no local config existed
  and network-backed configs remain outside the default boundary.

## Model Review Lanes

| Lane | Status | Disposition |
| --- | --- | --- |
| `kimi-coding/kimi-for-coding` | `not_assessed` | Returned repeated context-gathering/tool-call text and no substantive findings. |
| `minimax/MiniMax-M2.7` | `not_assessed` | Returned `404 page not found`. |
| `zai/glm-5.1` | `not_assessed` | Returned an off-task startup sentence and no substantive findings. |

Degraded lanes are not counted as clean review evidence.

## Verification

- `verified`: `go test ./internal/app ./internal/contextprep`
- `verified`: `go test ./...`
- `verified`: `jq empty schema/*.json`
- `verified`: `git diff --check`
- `verified`: `go run ./cmd/portolan context prepare --help`
- `verified`: Syft/CycloneDX output remained present after
  `context prepare --force`.
- `verified`: `tool-registry.json` recorded CycloneDX as `observed` /
  `metadata-visible`.
- `verified`: `oss-plan.json` recorded CycloneDX as `input_present`.

## Remaining Findings

- `minor`: Full Bigtop `jscpd` needs a separately approved bounded producer
  profile. The default generated-file-heavy invocation is too noisy for reliable
  acceptance.
