# Process Improvement Socratic Review - 2026-05-30

## Proposed Improvements

1. Include constitution context in PR review packets when docs/specs/governance are
   touched.
2. Add public-demo/public-artifact guardrails for cold-start smoke, redaction,
   and freshness.
3. Record MiniMax lane degradation and fallback handling.

## Review Lanes

| Lane | State | Disposition |
| --- | --- | --- |
| `kimi-coding/kimi-for-coding` | assessed | Narrowed constitution requirement to spec/governance-touching PRs; keep cold-start and freshness guardrails; prefer provider-agnostic fallback rule over broad provider policy. |
| `zai/glm-5.1` | assessed | Narrowed constitution requirement; kept cold-start and redaction procedure; accepted MiniMax failure record with concrete replacement handling. |
| `openrouter/deepseek/deepseek-v4-pro` | assessed | Accepted constitution packet requirement; narrowed public-demo guardrails to redaction verification and commit/freshness anchoring; accepted MiniMax incident record plus replacement rule. |

## Accepted Changes

- Updated `.agents/skills/portolan-spec-delivery/SKILL.md` so PR review packets
  include the constitution when specs, governance, or workflow files are in
  scope.
- Added concise public-doc/public-artifact review checks for cold-start vs
  reused smoke, freshness, redaction, and full-output publication boundaries.
- Updated `docs/review-harness-benchmark.md` with provider-error/no-output
  degradation handling and the 2026-05-30 MiniMax failure evidence.

## Rejected Or Narrowed

- Did not require full constitution/backlog/closeout packet for every PR.
- Did not add a detailed redaction procedure to the skill body; the skill now
  states what must be checked, while slice artifacts carry how-to detail.
- Did not treat MiniMax fallback as assessed after provider errors or no output.
