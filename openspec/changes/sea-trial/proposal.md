## Why

docs/MANIFEST.md defines acceptance as a sea trial on Apache Bigtop with
three gates — calibration questions, machine metrics, the Governor's read —
and acceptance/bigtop-sea-trial.md drafts the questions. Without a gate
runner, the trial is opinion: the machine checks, the fabricated-anchor
automatic fail, and the staleness flip have nothing to execute them.

## What Changes

- Add capability `sea-trial`: the gate runner that executes the Bigtop sea
  trial end to end.
- Present calibration questions Q1–Q12 (vessels, fairways, ports of entry
  and beacons, lights, dangers, unsurveyed) against the expedition's Chart
  and grade them: machine checks derived from the checkout's own BOM and
  manifests where they exist; expert-judged questions recorded for the
  Governor instead of machine-graded.
- Enforce the answer rules: every answer carries an anchor and a trust
  label; a fabricated (refuted) anchor fails the whole trial automatically.
- Compute the machine metrics: fairway completeness against the BOM-derived
  dependency list, trust distribution across the Chart, and the staleness
  flip after a single-file change.
- Fail the trial when the Chart guesses what should be `unsurveyed`.
- Take the Governor's read as the final sign and emit a reviewable trial
  report.

## Capabilities

### New Capabilities

- `sea-trial`: the acceptance gate — how a Portolan expedition is proven
  against the real Bigtop corpus: calibration grading, metrics,
  automatic-fail rules, and the Governor's final read.

### Modified Capabilities

(none)

## Impact

- Implementation lands later under `acceptance/` as deterministic tooling;
  it reads the Chart and calls soundings/probe outputs rather than
  reimplementing them.
- Requires a BOM-derived oracle (design decision recorded) and one
  reversible source edit for the staleness check (acceptance-only exception
  to the never-mutate rule, documented in design.md).
- No new runtime dependencies for the product core.
