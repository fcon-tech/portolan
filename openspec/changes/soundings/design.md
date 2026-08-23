## Context

See proposal.md — Why. The probe layer (`probe-tools`) already provides the
deterministic primitives soundings need: manifest facts, text search, and
the receipt log; core-foundation provides the chart types and store. This
change composes those primitives into the two verification operations and
adds no new product decisions — the verification role, the trust rules, and
the "determinism only serves verification" split are settled in
docs/MANIFEST.md.

## Goals / Non-Goals

**Goals:**

- `sound.anchor` and `sound.edge` exactly as specified in this change's
  spec delta: verdict + anchored evidence, honest `unconfirmed`, no writes.
- Deterministic implementations testable with plain fixtures.

**Non-Goals:**

- Any trust-label policy (mapping verdicts to labels is the Cartographer's
  judgment; the sea-trial change defines gate metrics, not the sounding).
- New external binaries or scanners; soundings reuse the probe layer.
- Batch/whole-chart sounding sweeps — per-check operations only until a
  consumer (sea trial) proves a need.

## Decisions

1. **Soundings are pure functions over the probe layer.** `sound.edge` =
   manifests lookup + scoped sweep; `sound.anchor` = file read + line slice
   (or log read for receipt anchors). No state, no caching, no mutation.
   Alternative: an indexed/derived verification database — rejected: v2 died
   of exactly that machinery; per-check determinism is the whole value.
2. **Verdict vocabulary: `confirmed` / `refuted` / `unconfirmed`.**
   `sound.anchor` yields `confirmed` or `refuted` (its checks are
   existence-and-content checks with a ground truth). `sound.edge` yields
   `confirmed` or `unconfirmed` (absence of manifest/import evidence cannot
   disprove a fairway — dynamic wiring exists). The sea trial's
   fabricated-anchor auto-fail consumes `refuted` from `sound.anchor`.
   Alternative: a single boolean — rejected: it would either over-claim
   (edge refutation) or under-claim (anchor refutation).
3. **Evidence reuses the Anchor shape from core-foundation.** Every verdict
   carries the anchors it was derived from, so a Governor can re-verify a
   sounding by hand. No verdict-specific citation format is invented.
4. **Chart access is read-only by construction.** Soundings accept asserted
   entries as input values; they never hold a store handle that writes.
   The spec's never-upgrade invariant is enforced by absence of a write
   path, not by discipline.
5. **Source-reference check scope: the source vessel's own paths.**
   `sound.edge` sweeps only the paths the chart attributes to the source
   vessel, keeping the check local and the evidence attributable.
   Alternative: whole-target sweep — rejected: slower and produces evidence
   outside the asserted unit, which the verdict then cannot honestly attach.

## Risks / Trade-offs

- [Rename-heavy targets make content checks brittle] → That brittleness is
  the product: a drifted anchor *should* refute; the Cartographer repairs
  the entry as a pending correction.
- [Import-style references vary per language] → The reference check is a
  name-based sweep (from the probe layer), not a parser; misses surface as
  honest `unconfirmed`, never as `refuted`.
- [Soundings on huge vessels scan a lot] → Accept for v1; scoping to the
  vessel's paths bounds it, and the sea trial corpus is the stress test.

## Migration Plan

Greenfield addition beside the probe tools. Rollback = delete the sounding
modules; nothing else depends on them yet.
