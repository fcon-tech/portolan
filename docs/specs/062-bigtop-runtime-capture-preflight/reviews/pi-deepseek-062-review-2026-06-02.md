# PI Review Lane: DeepSeek V4 Pro

Date: 2026-06-02
Model: `openrouter/deepseek/deepseek-v4-pro`
Harness: `pi --no-tools --no-context-files --no-session`

## Verdict

assessed:

- Pass with conditions.
- Preflight evidence honesty, runtime topology boundary, and approval safety
  passed.

## Findings

major:

- Negative-path preflight behavior was deferred without explicit scope handling.
- Cursor stress output did not include the prompt artifact.

minor:

- Blocked commands should consistently include `--docker-compose-plugin`.
- Requirements should mention the `blocked` approval classification.
- T012 remains open until review lanes are complete.

## Disposition

accepted and fixed:

- Added negative-path prerequisite behavior to out-of-scope/not_assessed scope.
- Added a Cursor stress prompt artifact.
- Normalized blocked command references to plugin mode.
- Added approval-blocked commands to FR-004 wording.

deferred:

- Controlled negative-path prerequisite simulation. It needs a separate harness
  or environment mutation and is not required for this positive preflight slice.
