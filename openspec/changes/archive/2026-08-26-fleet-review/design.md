# fleet-review Design

## Decision 1: explicit target list, no discovery

The CLI takes `--target` (repeatable). The export never scans the
filesystem for provinces — local-first, read-only, and no surprise crawling.
A target without `.portolan/chart/` fails the whole render loudly, naming
the offending path.

## Decision 2: the reviewing harbor owns the artifact

With targets A, B, C the page lands at `A/.portolan/fleet-review.html`. One
clearly named output location inside a real perimeter beats inventing an
output flag. Documented in the CLI usage text; the printed path names it.

## Decision 3: links, not embeds

Each province row carries counts derived from its index (kinds, trust
shares, top hub by fan-in, danger count, stale count) plus a link to that
province's Chart Room (`chart-room.html` relative to the reviewing harbor is
not guaranteed to exist → absolute `file://` URL built from the target
path). No chart content beyond arithmetic is embedded.

## Decision 4: one core function

`buildFleetReview(targets): { path, provinces }` in `core/src/chartroom/review.ts`,
a standalone template, and the `review` subcommand. Deterministic: same
targets, same bytes.
