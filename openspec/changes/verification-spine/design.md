# Design — verification-spine

## Context

The Governor grilled this change from backlog candidate C1 ("verification
surface as the product spine") on 2026-08-30. All product decisions were
settled there; this file records the decisions and the few genuinely open
implementation choices. Evidence base: the Portolan backlog study
(`measured` trust deficit; `charted` market gap, argument from absence).

## Decisions

1. **One new tool, no parameters.** `trust.report` takes `{}`, like
   `chart.read`. Filters over chart reads are deliberately absent: targeted
   staleness querying belongs to the future staleness-lifecycle change (the
   re-survey queue), which will parameterize reads organically. Minting a
   filter vocabulary now would front-run that design.
2. **Live re-sounding is the point.** A report that only aggregates
   `index.jsonl` is a SELECT the agent can already do with `chart.read`.
   The product claim is that the labels *hold now* — so the report re-runs
   the `sound.anchor` verification path over chart anchors and reports
   confirmed/refuted. It reuses the existing deterministic verifier; no new
   verification logic is invented.
3. **Deterministic sample above a fixed cap.** Full re-sounding could be
   slow on Bigtop-scale provinces. Cap constant: 500 anchors. Selection:
   entries in stored order, anchors in stored order, first 500 — stable
   under an unchanged chart, so repeat runs agree byte-for-byte in counts,
   verdicts, and ordering. The response always states sounded vs total, so
   partial coverage is never passed off as full.
4. **Refresh staleness first.** Same behavior as `chart.read`: the report's
   staleness section is computed after `refreshStaleness`, so the answer is
   never served from a stale signature. This is the only write the tool may
   cause (inside `.portolan/`, per the refresh's own contract).
5. **The receipt channel is committed artifacts, not prose.** Every public
   differentiation claim anchors to a receipt in this repository:
   - `docs/demo/trust-report.md` — the tool's own output over this repo's
     Chart (the repo is a charted province), rendered by a committed
     deterministic script; the reproduction command is printed in the file.
   - `docs/verification-trials.md` — competitor trials (Serena, Sourcegraph
     MCP): what was inspected (README/docs/tool lists, with URLs and trial
     date), what was found, each row trust-labeled. The market-gap claim in
     README/landing links here and is worded as "no surveyed tool", never
     as an absolute.
   The internal research dossier stays outside the repo; only reproducible
   receipts cross the public boundary.
6. **Skill mandate, not hope.** `skill/SKILL.md` gains the instruction to
   call `trust.report` when composing Sailing Directions and to report
   refuted anchors verbatim. Instructions are the channel agents obey;
   tool outputs are the other one — this change uses both.
7. **Out of scope (deferrals).** `chart.read` filters → staleness-lifecycle
   change. Adoption analytics (invocation receipts, trigger placement) →
   invocation-contract change; this change's gate therefore proves the
   surface exists and is honest, not that it is used. Liability-carrier
   views → later change, after demand validation. Any HTML dashboard of the
   report → none: passive surfaces are contraindicated (the corpse field).

## Risks / Trade-offs

- Re-sounding adds latency proportional to the sample (bounded by the cap).
  Acceptable for a summary tool called once per brief.
- `refreshStaleness` on every report call repeats work `chart.read` also
  does. Accepted for consistency; both are cheap tree hashes.
- The committed `docs/demo/trust-report.md` drifts when the repo's own Chart
  changes. Mitigation: the reproduction command is printed in the artifact,
  and staleness/staleness-counts make drift visible rather than silent.

## Migration

None. Additive: one tool, one skill section, docs. No stored-format change.
