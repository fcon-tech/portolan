## Context

See proposal.md — Why. The gate definition (three gates), the question set
(Q1–Q12), the answer rules, and the automatic-fail rule are owned by
docs/MANIFEST.md and acceptance/bigtop-sea-trial.md — this change only
designs the runner that executes them. The runner consumes artifacts the
other capabilities already define: the Chart (core-foundation), sounding
verdicts (soundings), manifest facts (probe-tools).

## Goals / Non-Goals

**Goals:**

- A deterministic runner: replayable, machine-checkable, zero model
  judgment inside it (the Cartographer produces the answers; the runner
  grades).
- A trial report a Governor can review as a diff.

**Non-Goals:**

- Reimplementing probes, soundings, or chart reading — the runner calls
  them.
- Threshold tuning beyond the gates the acceptance document already fixes
  (fairway-completeness targets beyond "measured and reported" are the
  Governor's judgment, not a constant).
- CI infrastructure, corpora other than Bigtop.

## Decisions

1. **Answer protocol: the expedition writes an answers artifact before
   grading.** The Cartographer answers Q1–Q12 into
   `<target>/.portolan/sea-trial/answers.jsonl` (question id, text,
   anchors, trust label); the runner grades that file. Alternative: an
   interactive Q&A session — rejected: acceptance must be replayable and
   diffable, and the artifact is itself evidence.
2. **The oracle lives in acceptance tooling, not in the served tools.**
   Machine checks need `bigtop.bom` entries — a Groovy-DSL build file
   outside the five manifest formats the `manifests` tool supports. The
   runner gets a narrow BOM reader of its own. This does not breach the
   no-parser rule: that rule governs the product's probe layer; the oracle
   is acceptance-side and reads one known file shape. Alternative: extend
   `manifests` to parse Groovy DSLs — rejected: opens the parser frontier
   the manifest closed.
3. **Fabrication gate = sound.anchor over every cited anchor in the
   answers artifact.** Reuses the sounding verdicts verbatim (`refuted` →
   automatic FAIL, named). No second anchor-checking implementation.
4. **Metrics computed from the Chart's machine index.** Fairway
   completeness = charted fairways vs the BOM-derived dependency list
   (report the ratio and name the missing); trust distribution = entry
   count per label over all entries; staleness flip = the runner edits one
   file under a chosen vessel, refreshes staleness, asserts the
   exactly-one-vessel flip, then reverts the edit. The edit is a
   whitespace-only append (no semantic change) and is restored even on
   failure. This is an acceptance-only, explicitly reversible exception to
   the never-mutate rule — the expedition itself never mutates source, and
   the trial runs on a disposable checkout. Alternative: ask the operator
   to edit by hand — rejected: makes the gate unreplayable.
5. **Unsurveyed-honesty check is enumerable, not holistic.** The runner
   checks the specific admissions the acceptance document fixes (runtime
   topology, deployed versions) plus any answer whose claim lacks anchored
   evidence where the question demanded `unsurveyed`. Model-holism stays
   in the Governor's read.
6. **Report at `<target>/.portolan/sea-trial/report.md`** (markdown,
   git-reviewable): per-question grades, the three metrics, gate outcomes,
   the Governor's verdict line. The Governor's read is captured as a
   prompted verdict recorded into the report; the runner never infers it.
7. **Verdict logic is a fixed gate tree, not a score.** FAIL if: any
   refuted anchor, any failed machine check, any unanswered question, any
   enumerated guess, or a negative Governor's verdict. Otherwise PASS.
   No weighted aggregate — the acceptance document defines gates, not a
   score.

## Risks / Trade-offs

- [`bigtop.bom` shape drifts across Bigtop versions] → The reader is
  narrow and fails loudly on unrecognized structure; pinning the trial to
  a stated Bigtop commit is the runner's documented launch requirement.
- [The staleness edit leaves the corpus dirty on crash] → The edit is a
  single append, reverted in a finally path; the report records before/
  after hashes of the touched file.
- [Answers artifact could be hand-tuned between runs] → The artifact is
  produced by the expedition and committed with the trial; the report
  hashes it so post-hoc edits are visible.

## Migration Plan

Greenfield under `acceptance/`. Rollback = delete the runner; the
acceptance document remains the contract either way.
