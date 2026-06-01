# Process Hardening Disposition

Date: 2026-06-01

## Trigger

This delivery session repeated three process failures:

- malformed no-tools review packet on first Kimi pre-implementation attempt;
- hung or off-task review lanes, including Kimi, MiMo, Qwen, and first
  DeepSeek attempt;
- stale check risk after amending closeout/status files and force-pushing.

## Changes

- `.agents/skills/portolan-spec-delivery/SKILL.md`
  - require command timeouts for `pi` lanes;
  - classify no-output timeout, tool-call output, context-mode instruction
    dumps, and malformed prompt packets as non-evidence;
  - require one retry or explicit enabled replacement when assessed coverage is
    still required;
  - require final PR scope check against `origin/main`;
  - state that previous green checks are stale after a pushed head change.
- `docs/review-harness-benchmark.md`
  - delegates timeout/off-task/malformed-packet policy to the repo-local skill
    to avoid duplicated normative text.

## Socratic Review

| Lane | Status | Result |
| --- | --- | --- |
| `kimi-coding/kimi-for-coding` | not_assessed | Returned a request to use context-mode tools instead of reviewing the patch. |
| `zai/glm-5.1` | assessed | `CHANGES_REQUESTED`: reduce duplication, clarify retry rules, avoid overfit replacement wording. |

## Disposition

- Accepted: make the skill authoritative and remove duplicated normative text
  from the benchmark document.
- Accepted: clarify retry behavior as one retry or explicit replacement when
  coverage is still required.
- Accepted narrowly: replace rigid replacement wording with "enabled
  replacement lane that satisfies current independence rules"; Portolan still
  excludes GPT-family lanes from independent evidence when the current rules
  require non-GPT coverage.
- Rejected: add detailed git-mechanism instructions for pruning adjacent specs.
  The existing rule names the required final evidence and avoids prescribing
  risky interactive git commands.

## Status

Process hardening is included in PR #28 as a small repo-local improvement tied
to observed failures from this delivery session.
