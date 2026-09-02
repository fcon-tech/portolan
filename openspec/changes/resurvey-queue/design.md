# Design — resurvey-queue

## Context

Backlog candidate C3 (swarm research, 2026-08-30) wanted staleness
promoted to a first-class, queryable property plus a fan-in-ranked
re-survey queue. Reconnaissance before this change found the first half
already shipped: `stale` is a stored flag on every index entry, refreshed
by `refreshStaleness` on every read and reported by `trust.report`. The
Governor confirmed the narrowing (grilling, 2026-09-02): this change
builds only the queue.

What stands today: `repairProposal` folds every drifted vessel into one
grouped row (`proposals.ts`); the night policy compares that row's vessel
count against `harbor.auto_repair_max_vessels` — all-or-nothing on the
group; `trust.report` lists pending vessels sorted by id; fan-in ranking
exists only inside `chart.neighborhood`, over entry ids.

## The design law applied

The queue already rides the two channels agents honor: the harbor watch
is mandated in the skill's session-start region, and the queue reaches
the Governor as tool/chat output. Making the queue ranked changes its
contents, not its channel — no new surface, no new mandate, nothing
passive.

## Decisions

- **The queue lives in the harbor, not in a new tool.** A fifteenth
  `chart.resurvey` tool would duplicate the decision surface
  `expeditions.propose` already serves — same rank, one row later — and
  drag the full invocation triple behind it. The harbor chat
  presentation is the surface the skill already mandates and the
  Governor already answers with one phrase.
- **Per-vessel repair proposals with drift-sensitive fingerprints.**
  Evidence is `vessel/<id>#<stale-entry-count>`: the count makes the
  fingerprint change when the vessel's drift changes, so a refusal holds
  while the drift is unchanged and reopens when it grows or shrinks —
  the living spec's reopen rule, per vessel. (A constant `vessel/<id>`
  key would suppress a declined vessel forever; the socratic pass caught
  this and it was fixed.) Scope entries are charged by the same rule
  `trust.report` uses — a stale fairway drags on both its endpoints —
  so the queue and the report quote one number for one vessel.
  Declining one vessel no longer hides the others; accepting one no
  longer commits the Cartographer to a blob scope. The append-only
  history needs no migration: new fingerprints simply do not collide
  with old grouped ones. A vessel whose charted paths hold no soundable
  regular file — the deleted-coast case — is still proposed, its anchor
  omitted, never faked (the new-land precedent).
- **Rank = direct cross-vessel charted fan-in, ties by vessel id.** The
  same principle `chart.neighborhood` serves, lifted to vessels: count
  charted fairways whose target vessel is this vessel and whose source
  vessel is a different vessel. Deterministic, cheap, one pass over the
  index — arithmetic over charted bytes, no timestamps, no judgment.
  Intra-vessel fairways are excluded: a vessel's internal traffic says
  nothing about how much of the rest of the chart hangs from it. This is
  deliberately a second definition beside the neighborhood's (which
  counts every charted incoming fairway per entry): same term, two
  scopes, and the divergence is stated in the spec so nobody "unifies"
  them away.
- **The night bound becomes cumulative.** Per-proposal comparison would
  be meaningless after the split — every row holds exactly one vessel,
  so any positive bound would pass every row and "bounded" would bound
  nothing. The policy therefore spends the bound down the queue order:
  launch the highest-ranked repairs until `auto_repair_max_vessels`
  vessels are committed, leave the rest pending. A launch attempt spends
  the bound whether or not the launch succeeds — accept-then-append-
  failure is the watch's standing semantics, and refunding would hand
  the bound to rows the queue ranked lower. "Never curious" is
  untouched: repair only, cap always.
- **`trust.report` speaks with the queue's voice.** The pending-vessel
  list adopts the same rank (it keeps its wider membership — stale
  fairways charge both endpoints, so the report can name a vessel the
  repair queue does not; order, not membership, is what unifies).
- **Granularity stays per-vessel.** The tree signature cannot name
  changed files, and content hashing was rejected on purpose
  (harbor-master design, decision 3): the repair expedition re-reads
  content anyway. Ranking vessels is what the cheap signature supports;
  going finer would tax every read for the paranoid case.

## Alternatives considered and rejected

- **Evidence-size ranking** (count of stale entries, the harbor's
  existing tie-break): counts bulk, not consequence — a leaf with many
  stale entries outranks the hub the whole chart hangs from. Rejected as
  the primary key; kept as nothing — fan-in then vessel id is the whole
  rule, no third term.
- **Combined score** (fan-in weighted by stale entries): a tuning knob
  with no evidence behind any weight setting; two graded terms where the
  research supports one directional signal. Rejected.
- **`chart.resurvey` as a fifteenth tool** riding the invocation triple:
  duplicates the harbor queue behind a new surface and a new mandate.
  Rejected by the design law and by the smaller-change rule.
- **Content hashing for file-level granularity**: rejected twice before
  (staleness design decision 3; grilling Q5); the repair expedition
  re-reads content anyway.

## Honest evidence bookkeeping

- The gap ("nobody marks claims stale; every artifact class rots
  silently") is `measured` in the C3 research; the pain grade is
  `charted`.
- The fan-in rank itself is `reported`-grade: an Aider-lineage
  engineering choice with production precedent and no rigorous published
  eval — exactly the standing `chart.neighborhood`'s ranking carries.
  The queue proposes; the Governor decides; nothing in this change
  claims fan-in order is a proven repair priority.
- No agent-level ablation is in scope; whether ranked repairs beat
  unranked ones on Bigtop-scale drift stays `unsurveyed`.

## Deferrals and advisor dissent (socratic pass, 2026-09-02)

The socratic advisor's findings, applied where they closed holes and
recorded where they lost:

- **Applied — reopen semantics.** The advisor showed a constant
  `vessel/<id>` evidence key never reopens a declined proposal, against
  the living spec's reopen rule. The evidence key now carries the
  vessel's stale-entry count.
- **Applied — the chat cap was struck.** The draft capped the queue's
  chat rendering at ten rows; the advisor noted it mopped up flooding
  this change itself introduces, had no spec coverage, and broke
  "accept or decline by number". Cut: the headless post stays complete,
  and the Cartographer-side session-start message already carries the
  spec's "present the top proposals" discretion. Kill-trigger: a real
  wide-drift post proves unreadable — bring the cap back with its spec
  scenario in the same change.
- **Applied — spec precision.** Rank wording moved onto vessel
  endpoints (fairways join vessels, entries do not hang); the
  divergence from the neighborhood's fan-in definition is stated in the
  spec; an anchorless vessel is proposed with its anchor omitted, never
  faked; a launch attempt spends the night bound regardless of outcome;
  per-vessel scope attribution is pinned to the report's charge rule.
- **Declined, recorded — a stale-entry tie-break.** The advisor argued
  for fan-in desc, stale entries desc, vessel id — lexical ties are an
  alphabet accident with operational consequence. Kept as settled in
  grilling (2026-09-02): ties by vessel id.
- **Declined, recorded — leave `trust.report` sorted by id.** The
  advisor argued the ordering couples two capability specs for one
  list's aesthetics and the membership is a superset anyway. Kept as
  settled in grilling (2026-09-02): the report adopts the queue's
  order; membership is unchanged.
- **Deferred — transitive or depth-weighted fan-in.** Kill-trigger: the
  Governor repeatedly hand-reorders the queue on real drift — the
  rank's first honest falsification.
- **Deferred — refunding the night bound on launch failure.**
  Kill-trigger: a real night run where launcher failures starve the
  queue for a full cycle.
- **Deferred — reconciling the two fan-in definitions.** Kill-trigger:
  the next change that touches `chart.neighborhood`; spec churn here
  buys no behavior.
- **Standing.** Ranked-vs-unranked repair stays `unsurveyed` (above);
  the shared helper stays a leaf module with exactly two importers —
  `chart.neighborhood` keeps its own inclusive count.

## Security review notes (adversarial pass, 2026-09-02)

The security auditor's findings against the hand-edited-index threat
model (the index is agent-writable; defense lives in soundings,
receipts, and the Governor, not in the index's honesty):

- **Recorded, deferred — the reopen signal is chart-derived.** The
  stale-entry count in `vessel/<id>#<count>` can be pumped by index
  edits alone (appended fairway rows, a symlinked vessel's perpetual
  drift), voiding a Governor's refusal and letting the night watch
  auto-launch the declined repair. Class-equivalent to the pre-change
  grouped key (a fake drifted vessel joined that evidence set the same
  way); the proposed source-derived key hashes `signature.hash`, which
  lives in the same writable index and buys nothing against an attacker
  who already edits it. The real cost is attention (a bounded, recorded,
  re-survey-only launch), not integrity. Kill-trigger: a real refusal
  observed voided without source drift — move the reopen signal to
  something outside the index (receipted survey state), as its own
  change.
- **Recorded, deferred — fail-spend on wide drift.** The cumulative
  bound spends its full allowance nightly when drift never heals (e.g.
  symlinked vessels are perpetually stale), where the old grouped row
  launched nothing past the bound. Governor-approved semantics (Q7);
  the spend stays inside the operator's own knob, launcher, and timeout.
  Kill-trigger: a real night run observed spending its bound on
  never-healing drift twice in a row — gate auto-repair eligibility on
  provable (signature-stamped) drift.
- **Recorded, deferred — duplicated index rows pump rank and counts.**
  `vesselFanIn` counts raw fairway rows, so appended duplicates move a
  vessel's rank and quoted scope. Consistent with the neighborhood's
  own inclusive count; deduping there would diverge the two definitions
  further. Kill-trigger: the first observed duplicated-row artifact in
  a real province — dedupe `(from, to)` in the shared leaf then.
- **Named for the Governor — upgrade effect.** All pre-change grouped
  repair fingerprints become uncomputable at deploy, so every
  pre-upgrade refusal expires: expect previously declined repair rows to
  reappear on the first post-merge queue computation. Documented as
  intended (append-only history, no migration).
