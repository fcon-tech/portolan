# Demo Artifact Policy

**Date**: 2026-05-30

## Maintainer Decision

- `verified`: Apache Bigtop is the public demo target.

## Recommendation

The maintainer approved this first-slice policy:

- `docs/demo.md` runbook;
- command snippets;
- small redacted excerpts from `summary.json`, `map.md`,
  `evidence-index.jsonl`, and `answer-contract.md`;
- privacy/freshness review.

Do not commit the full generated Bigtop output bundle in the first public
showcase slice. Do not add screenshots or terminal recordings in the first
slice unless separately approved.

## Rationale

Full Bigtop outputs can be large, stale, and path-heavy. A runbook plus
redacted excerpts is enough to show the artifact shape while reducing privacy,
repository bloat, and maintenance risk. Full artifacts can be added later after
size, license, path, secret, and freshness review.

## Remaining Decisions

- `not_assessed`: Fresh Apache Bigtop demo run in this branch.
- `not_assessed`: Privacy/freshness review for redacted excerpts.
