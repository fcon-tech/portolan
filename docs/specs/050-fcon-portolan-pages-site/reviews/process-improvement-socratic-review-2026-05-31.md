# Process Improvement Socratic Review

**Date**: 2026-05-31

## Proposed Improvement

After spec 050 pre-implementation review, parallel `pi` launches produced
`database is locked` extension startup failures. Proposed process update:

- run `pi` review lanes sequentially;
- record `database is locked` as harness failure;
- avoid counting failed lanes as assessed evidence;
- use no-tools flags only for bounded no-tools review packets.

## Socratic Review Lanes

| Lane | Status | Verdict | Strongest objection |
| --- | --- | --- | --- |
| `kimi-coding/kimi-for-coding` | assessed | CHANGE | Sequential launch rule is good, but blanket `--no-*` flags would cripple repo-grounded reviews. |
| `zai/glm-5.1` | assessed | CHANGE | A permanent no-tools-everywhere policy is disproportionate to a transient database-locking race. |

## Final Disposition

Accepted:

- add sequential `pi` lane rule to the repo-local delivery skill;
- record `database is locked` as harness failure;
- retry sequentially;
- keep no-tools flags only for explicitly bounded no-tools text reviews.

Rejected:

- making `--no-extensions --no-skills --no-prompt-templates --no-tools --no-context-files --no-session` the default for all reviews.

## Not Assessed

- Upstream `pi` fix availability.
- Whether the lock issue reproduces on other machines.
- Whether a future `pi` version removes the sequential-launch constraint.
