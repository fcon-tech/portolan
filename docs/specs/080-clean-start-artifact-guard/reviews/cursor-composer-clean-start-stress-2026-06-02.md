# Cursor Composer Clean-Start Stress

Spec: `docs/specs/080-clean-start-artifact-guard/`

Date: 2026-06-02

Harness: `cursor-agent --print --mode ask --model composer-2.5 --trust`

Target: `/home/fall_out_bug/projects/bigtop-landscape`

Allowed context:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context`

## Raw Artifacts

- Prompt:
  `docs/specs/080-clean-start-artifact-guard/stress/cursor-clean-start-guard-prompt-2026-06-02.md`
- Pre-fix output:
  `docs/specs/080-clean-start-artifact-guard/stress/cursor-clean-start-guard-output-2026-06-02.md`
- Post-stale-scrub output:
  `docs/specs/080-clean-start-artifact-guard/stress/cursor-clean-start-guard-output-after-fix-2026-06-02.md`
- Final output:
  `docs/specs/080-clean-start-artifact-guard/stress/cursor-clean-start-guard-output-final-2026-06-02.md`

## Pre-Fix Finding

failed:

- Cursor Composer 2.5 did not read forbidden sibling stress roots, root-level
  `run/`, map bundles, or `producer-runs.jsonl`.
- It found that the fresh `evidence-index.jsonl` still promoted three
  producer-run records as `verified` / `metadata-visible` while their `path`
  and `output_path` fields pointed to sibling
  `.portolan/stress/20260601-054-initial-proof/tool-outputs/...` artifacts.
- This made clean-start hygiene depend on the agent obeying prose over indexed
  evidence self-consistency.

disposition:

- Accepted.
- Fixed by downgrading verified producer-run outputs under sibling
  `.portolan/stress/*` run roots to `not_assessed` in fresh stress contexts and
  scrubbing stale `path`, `output_path`, and `command` fields.

## Post-Scrub Finding

failed:

- Cursor Composer 2.5 verified the stale producer-run paths were scrubbed and
  downgraded, but found `agent-brief.md` still summarized local producer runs
  with ambiguous `verified` wording while `evidence-index.jsonl` marked all
  five producer-run records as `not_assessed`.

disposition:

- Accepted.
- Fixed by making the producer-run summary count current `verified` and
  `not_assessed` statuses from the generated evidence records.

## Final Result

verified:

- Cursor Composer 2.5 read only the eight fresh context artifacts:
  `agent-brief.md`, `answer-contract.md`, `query-plan.md`, `repos.json`,
  `tool-registry.json`, `oss-plan.json`, `evidence-index.jsonl`, and
  `gaps.jsonl`.
- Forbidden path check: no sibling stress roots, root-level `run/`, map
  bundles, prior reports, or files outside the fresh context were read.
- `tool-registry.json` is empty.
- `agent-brief.md` reports 5 local producer-run records, 0 verified current
  records, and 5 `not_assessed`.
- `evidence-index.jsonl` keeps prior producer-run metadata visible as
  `not_assessed`; stale sibling stress producer outputs are not exposed as
  `path`, `output_path`, or `command`.
- Future OSS acquisition paths in `oss-plan.json` are bounded to the current
  context output directory.

not_assessed:

- Physical absence of sibling stress or root-level `run/` artifacts on disk;
  the lane intentionally did not inspect forbidden paths.
- Whether an arbitrary agent would honor the boundary if it ignored the pack
  contract.
- Runtime topology, duplication, dependency graphs, and map-bundle claims; no
  map bundle was in this context-only lane.

Stop reason: final Cursor Composer 2.5 clean-start stress passed for the spec
080 context pack. Remaining work is local baseline verification, independent
re-review for evidence semantics, PR push, and GitHub check refresh.
