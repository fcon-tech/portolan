# Tasks — verification-spine

## 1. Competitor trials (gate for all positioning)

- [ ] 1.1 Inspect Serena (README, docs, tool list, MCP surface) and
      Sourcegraph MCP (same): do they market or serve verified anchors,
      trust labels, receipts, or staleness? Record what was inspected with
      URLs and the trial date.
- [ ] 1.2 Write `docs/verification-trials.md`: one row per competitor per
      property, each finding trust-labeled and anchored to the inspected
      source; state the trial scope and its limits (argument from absence).
- [ ] 1.3 Verification: every claim in the page carries a label and an
      anchor; no machine-home paths (leak-gate stays clean).

## 2. `trust.report` core module

- [ ] 2.1 `core/src/tools/trust-report.ts`: aggregate over `readChart` —
      trust-label distribution, per-kind counts, staleness after
      `refreshStaleness`, log summary; re-sound every chart anchor via the
      existing `sound.anchor` path, stating sounded and total; refuted list
      sorted by entry id then anchor index.
- [ ] 2.2 Tests (from the spec scenarios): one-call summary shape; fresh
      staleness after a source touch; nothing written when signatures are
      unchanged; refuted anchor named with the entry left unchanged;
      repeat-run agreement over an unchanged province.
- [ ] 2.3 Verification: `bun test` green; `bunx tsc --noEmit` in `core/`.

## 3. Serve the tool

- [ ] 3.1 Register `trust.report` in `core/src/server/registry.ts`
      (thirteenth tool, input schema `{}`); MCP wiring test: call through
      the server client.
- [ ] 3.2 Verification: `bun test` green; the registry test lists thirteen
      tools.

## 4. The committed receipt

- [ ] 4.1 Thin deterministic script (`scripts/`, ~20 lines) that runs the
      report module against a target and writes markdown; run it on this
      repo; commit `docs/demo/trust-report.md` with the reproduction
      command printed inside.
- [ ] 4.2 Verification: re-running the command is byte-identical;
      leak-gate clean.

## 5. Skill mandate

- [ ] 5.1 `skill/SKILL.md`: Sailing Directions section instructs calling
      `trust.report` for the verification summary and reporting refuted
      anchors verbatim; tool desk gains the row.
- [ ] 5.2 Verification: `bun run skill/verify/checks.ts` passes.

## 6. Positioning with receipts

- [ ] 6.1 README: verification-spine paragraph; differentiation claims
      worded as "no surveyed tool" and anchored to `docs/demo/trust-report.md`
      and `docs/verification-trials.md`.
- [ ] 6.2 `docs/landing.html`: same wording, same anchors.
- [ ] 6.3 `docs/MANIFEST.md`: tool table gains `trust.report`; glossary row
      for the verification summary.
- [ ] 6.4 Verification: every new claim in these files carries an anchor;
      `scripts/leak-gate.sh` clean.

## 7. Gates and review

- [ ] 7.1 Full gates: `bun test`; `bunx tsc --noEmit` in `core/` and
      `acceptance/`; `openspec validate --specs --strict`;
      `bun run skill/verify/checks.ts`; `scripts/leak-gate.sh`.
- [ ] 7.2 Code review of the whole change; security pass (file reads only,
      no network, no source mutation).
- [ ] 7.3 Scenario gate (Governor's read): a fresh session over a charted
      province calls `trust.report` and reports the summary; the Governor
      confirms it reads true. Adoption analytics is explicitly out of scope
      (separate invocation-contract change).
