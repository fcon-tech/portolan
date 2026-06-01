# PI Review Lane: DeepSeek V4 Pro

Date: 2026-06-02
Model: `openrouter/deepseek/deepseek-v4-pro`
Harness: `pi --no-tools --no-context-files --no-session`

## Verdict

not ready at review time:

- The initial packet had ambiguous `gradle` availability/classification and did
  not explicitly state the `jdeps` and empty-file hash interpretations.

## Findings

critical at review time:

- `gradle` was listed as absent without an explicit `not_found` row and was
  incorrectly grouped with def/ref indexers.
- The `jdeps` exit-code interpretation was not explicit enough.
- Empty file hashes needed an explicit statement that they prove empty probe
  outputs, not skipped probes.

## Disposition

accepted and fixed:

- Re-ran the tool availability output with explicit `found` / `not_found`
  status.
- Updated the ledger hashes and sizes after the availability output changed.
- Moved `gradle` to absent build-tool status, not def/ref indexer status.
- Added the explicit `jdeps` interpretation: exit `0` proves the tool can run,
  not that project graph evidence exists.
- Added the explicit zero-byte hash interpretation for the empty class/artifact
  probe outputs.
