## Context

The 2026-09-06 core repair overreached its scope (42 corrected entries
against a 27-entry, one-vessel charter; see proposal.md — Why) while its
instructions said not to. The harbor queue today computes from three
inputs (`harbor` spec, "Proposals are computed, not imagined"); the ship's
log receipts every command (`tools` spec) and every chart write lands in
it; `formats-pass` (in review, MR #94) fixes the receipt shape as a
versioned schema whose `meta` field is free-form. Grilling (2026-09-06)
settled: charter as recorded promise, overreach computed and loud, flares
as queue proposals riding the repair policy, terms Charter/Чартер and
Flare/Ракета.

## Goals / Non-Goals

**Goals:**

- The promise is on record before work begins; the answer is on record
  when it ends; what happened between the two is derivable from receipts.
- Out-of-charter needs have a legitimate route into the queue.

**Non-Goals:**

- No write blocking: `chart.write` never rejects an entry for being
  outside a charter (overreach is measured, not prevented).
- No new tool: flares and charters ride `log.append` receipts.
- No night-policy change: flare rows are repair rows under the existing
  bound — this is a stated non-change, not an oversight.
- No compliance claim: receipts are agent-written facts; the spec's own
  wording keeps that honesty.

## Decisions

**D1 — Flares are ship's-log receipts, closed by decision arithmetic.**
A flare is a receipt whose `meta` carries `kind: "flare"`, the vessel, the
stated reason, and evidence; no new file, no new tool, and no coupling to
the formats-pass receipt schema (`meta` is free-form there). `propose()`
reads the log for open flares. A flare is open until the harbor history
records a decision — accepted or declined — on a repair proposal for its
vessel that postdates the flare receipt; the decision closes the flare
outright (socratic pass 2026-09-06: the launch→completion join existed
only to delay closure, and an outcome receipt already makes a skipped
repair loud). Repair rows are per-vessel keyed since the resurvey change,
so multiple flares on one vessel fold by filter-plus-concat — the row
carries every reason; one decision closes them all. No join layer. Why
not a `flares.jsonl` state file: it would fork the truth the log already
holds and need its own write path; closure-by-arithmetic keeps everything
append-only.

**D2 — Charter is a receipt pair; overreach is one shared function.**
Start receipt (`meta.kind: "charter"`, vessels and entries promised),
outcome receipt at the end. Overreach = chart-write receipts whose touched
vessels fall outside the charter, computed by one core function that both
the watch report and `trust.report` call, so the two surfaces cannot
diverge. Chart-write receipts already name their command and scope; if
the current shape does not name the written vessels, the marker is added
inside `meta` — additive, schema-safe.

**D3 — The launcher renders the charter; the skill teaches it.**
When an expedition is launched from a proposal, the brief carries the
charter line derived from the proposal's scope (the existing "Scope: do
only what the proposal names" line becomes the charter, now receipted).
`skill/SKILL.md` gains the method steps: record charter at start, flare on
out-of-charter finds, outcome at end. Prompt lines steer; receipts
measure — the 2026-09-06 overreach proved prompts alone do not hold.

**D4 — Absence reads as absence.**
Provinces and logs written before this change have no charter or flare
receipts; the watch report, `trust.report`, and `propose()` treat that as
an empty section, never an error. No migration.

## Risks / Trade-offs

- [Detection is arithmetic over honor-system inputs] → The failure mode
  of the 2026-09-06 run was invisibility, not absence of enforcement;
  loud receipts change that. A hard write-block was declined (grilling,
  Q2) because it needs scope plumbing inside the write tool and outlaws
  legitimate adjacent fixes.
- [Flare closure by vessel-and-time matching can close a flare whose
  specific issue a repair did not address] → Accepted: any repair of the
  vessel after the flare answered the need on record; a re-found need
  fires a new flare. Matching by issue text would be judgment, not
  arithmetic.
- [Log growth from charter/flare receipts] → Negligible: two receipts per
  expedition, one per flare; the log already receipts every command.

## Migration Plan

Additive only: new receipt markers, one more queue input, two report
sections, prompt/skill/glossary text. No data migration; rollback is
reverting the branch. At merge: `@portolan/core` version bump + CHANGELOG
entry per standing rules.

## Open Questions

None blocking. The exact `meta` field names for markers are task-level
and must only satisfy: valid against the formats-pass receipt schema
(free-form `meta`), deterministic to read, named in the spec scenarios'
spirit.
