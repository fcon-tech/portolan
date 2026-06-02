# Research: jscpd Sharded Duplication Plan

Date: 2026-06-02

## Decision: Repository-sharded jscpd recipes

Use one native jscpd command per discovered repository when context preparation
finds multiple repositories.

Rationale:

- Bigtop full-root jscpd failed with Node OOM.
- Repository shards reduce per-process source volume while keeping each command
  understandable and auditable.
- Native jscpd JSON output remains the evidence source; Portolan only
  recommends commands and later normalizes local outputs.

Tradeoff:

- Per-repo sharding does not detect cross-repo clones. This remains
  `not_assessed` unless a later approved workflow runs a cross-repo producer
  safely.

## OSS Reference

- jscpd supports CLI source paths, JSON reporting, output directories,
  `--min-tokens`, `--min-lines`, `--max-lines`, `--max-size`, `--ignore`,
  `--noSymlinks`, and `--silent` according to the official jscpd documentation:
  `https://kucherenko.github.io/jscpd/modules/jscpd.html`
- jscpd documents that JSON reporter output is `jscpd-report.json` and that
  JSON/XML reports are saved in the output directory.
- jscpd documents `leveldb` as a store option but says it requires
  `@jscpd/leveldb-store`; this slice does not suggest `--store leveldb`.

## Rejected Alternatives

- Portolan-owned duplicate detector: rejected; prior stress already removed the
  in-house detector and the product boundary favors OSS producer output.
- Root-level `NODE_OPTIONS` memory escalation: rejected as a default because it
  tunes the operator environment and still leaves agents with a whole-landscape
  command.
- MCP/skill-only instruction without CLI recipe: rejected because the current
  `oss-plan.json` contract already gives bounded CLI recipes and must remain
  useful without a specific harness.
