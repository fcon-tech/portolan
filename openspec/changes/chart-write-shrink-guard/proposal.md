## Why

Live incident (Bigtop fleet, 2026-08-27): a gap expedition issued a
full-replace `chart.write` carrying only its own two entries — the store
obeyed, and 85 real entries were silently clobbered (recovered from HTML
snapshots, receipt r43). Full-replace semantics are right; silent mass
shrink is not.

## What Changes

- `chart.write` SHALL reject a full-replace whose entry count drops below
  75 % of the existing entry count unless the caller passes
  `allowShrink: true`; the rejection names both counts and the override.
- First-ever write (no existing entries) and equal-or-growing writes are
  unaffected. `allowShrink` becomes an optional `chart.write` argument
  (MCP schema + store option), so a legitimate retire-heavy correction can
  still happen — loudly, by explicit choice.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `chart`: adds requirements (ADDED deltas): the shrink guard, its
  threshold and override, and its exemption for the first write.

## Impact

- Code: `core/src/chart-store.ts` (one guard + option plumbing),
  `core/src/server/registry.ts` (schema + pass-through), tests. The skill
  needs no change: an agent seeing the rejection learns the override from
  its message.
