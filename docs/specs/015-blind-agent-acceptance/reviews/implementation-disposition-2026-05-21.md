# Implementation Disposition: Blind Agent Acceptance

Date: 2026-05-21

## Implementation State

Implemented the spec 015 protocol surface:

- added `docs/agent-toolbox/blind-acceptance.md` with the allowed prompt,
  forbidden hints, required evidence bundle, status taxonomy, target rules, and
  review procedure;
- added `docs/specs/015-blind-agent-acceptance/templates/run-ledger.md`;
- added spec-local review evidence home under
  `docs/specs/015-blind-agent-acceptance/reviews/`;
- updated Bigtop smoke docs so local fixtures are preflight only and real
  Bigtop acceptance requires a local Bigtop checkout plus the blind protocol;
- defined the first non-Bigtop control fixture for preflight while preserving
  the later external operator control as `not_assessed`;
- recorded Bigtop fixture and control fixture preflights as degraded preflight
  evidence, not acceptance proof;
- updated spec, task, and backlog statuses to distinguish implemented protocol
  from unassessed blind operator runs.

## Review Disposition

### Pre-implementation local review

Accepted findings from
`docs/specs/015-blind-agent-acceptance/reviews/pre-implementation-review-disposition-2026-05-21.md`
were fixed:

- stable blind protocol document added;
- run-ledger template added;
- fixture preflight separated from real acceptance;
- control fixture documented as preflight only.

### Independent review lanes

- `minimax/MiniMax-M2.7`: no blocking findings. Approved the evidence framing,
  backlog status, and `not_assessed` treatment for missing real runs.
- `zai/glm-5.1`: accepted minor findings to disambiguate the duplicate README
  link label and remove "partially complete" wording from T016. Rejected the
  major finding that core new files were absent: the review prompt used
  `git diff` before staging, so untracked files were omitted from that prompt;
  local inspection verified the files exist in the working tree.
- `kimi-coding/kimi-for-coding`: degraded to `not_assessed`; the lane did not
  return a substantive result within the implementation review window.

### PR-level review lanes

- `openrouter/qwen/qwen3.6-plus`: no blocking findings. Noted that fixture
  ledgers cannot validate forbidden hints because no blind prompt was issued;
  this is already recorded as preflight-only evidence.
- `openrouter/deepseek/deepseek-v4-pro`: no blocking findings. Accepted minor
  findings to mark Bigtop T019 complete and make the plan's evidence-state
  honesty row more explicit. Rejected missing-file concern as prompt-truncation
  noise; PR diff and local inspection include `spec.md`.
- `openrouter/~google/gemini-pro-latest`: degraded for two file-presence
  findings caused by truncated PR diff context; local inspection verified
  `templates/run-ledger.md` and `implementation-disposition-2026-05-21.md`
  exist and are populated.

## Verification

- verified: `go test ./...`
- verified: `jq empty schema/*.json`
- verified: `git diff --check`
- verified: `go run ./cmd/portolan map --root internal/testfixtures/map-command/repo --out /tmp/portolan-015-control-preflight --force`
- verified: `jq empty /tmp/portolan-015-control-preflight/run.json /tmp/portolan-015-control-preflight/graph.json`
- verified: `findings.jsonl` and `map.md` were non-empty in the control fixture
  preflight output.
- verified: `go run ./cmd/portolan map --root internal/testfixtures/apache-bigtop-smoke/repo --out /tmp/portolan-015-bigtop-preflight --force`
- verified: `jq empty /tmp/portolan-015-bigtop-preflight/run.json /tmp/portolan-015-bigtop-preflight/graph.json`
- verified: `findings.jsonl` and `map.md` were non-empty in the Bigtop fixture
  preflight output.
- verified: the allowed prompt block in
  `docs/agent-toolbox/blind-acceptance.md` contains no Bigtop-specific file
  names, package names, build instructions, or guide paths.

## Remaining Risks

- not_assessed: Cursor + Composer 2.5 blind operator run.
- not_assessed: real local Apache Bigtop checkout blind run.
- not_assessed: external blind operator control run against a non-Bigtop local
  target.
- risk: the first real operator run may reveal that the allowed prompt still
  needs tighter transcript preservation instructions for specific harnesses.
