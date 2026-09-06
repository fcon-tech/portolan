## Context

The chart entry contract already exists as a JSON Schema
(`core/schema/chart.schema.json`, ajv draft 2020-12 in `core/src/validate.ts`)
but carries no version; `core/src/types.ts` hand-mirrors its ontology;
`log.jsonl` receipts (`core/src/tools/log.ts`) have a stable-in-practice shape
that nothing names; `chart.neighborhood` (`core/src/tools/neighborhood.ts`)
already implements records+bytes budgets with loud truncation over the same
machine layer the export needs. Motivation and Governor's decisions:
proposal.md — Why; the grill (2026-09-06) fixed scope, formats list, semver
from 0.1.0, surfaces, and done-criteria.

## Goals / Non-Goals

**Goals:**

- Four schema files that are the single source of four format contracts,
  each self-identifying (`version` + `$id`).
- One export document, derivable, machine-readable, consumable without MCP.
- Schema → code in one direction: the hand mirror cannot drift.

**Non-Goals:**

- No npm package, no site, no registry of formats (YAGNI until a consumer).
- No change to data files: `index.jsonl` and `log.jsonl` keep their shapes;
  no backfill, no migration.
- No HTML: the Chart Room stays the only human surface; the export is JSON.

## Decisions

**D1 — Version lives in the schema file, `$id` stays stable.**
A top-level `"version": "0.1.0"` keyword on each schema (JSON Schema allows
extra keywords; ajv ignores them for validation). Alternatives: version in
the `$id` path (`…/v0.1/chart.schema.json`) — rejected: churns the identity
on every release and breaks references; version only in docs — rejected:
docs drift, files don't.

**D2 — Trust vocabulary is a standalone schema; chart schema `$ref`s it.**
`trust-vocabulary.schema.json` holds the closed enum; `chart.schema.json`
references it by `$id`, and `validate.ts` registers both
(`ajv.addSchema` already supports `$id`-based refs — verified against the
current wiring). Alternative: inline the enum in both files with an
equivalence test — rejected: two copies to keep honest, and the spec's
"single source" would be a polite fiction. Consumers validating the chart
schema standalone need both files; they ship in the same directory and any
draft-2020-12 validator resolves `$id` refs.

**D3 — The receipt schema documents reality, no redesign.**
`receipt.schema.json` describes exactly what `log.ts` writes today
(`id`, `command`, `scope`, `outcome`, `recordedAt`, `meta` with its current
optionality), so every historical line validates. If writing reveals a field
the schema would reject, the schema follows the writer in 0.1.0 — renaming
or reshaping receipts is a breaking change for a later, 0.x-minor release,
not a smuggled fix. Verification task: validate the province's full existing
`log.jsonl` in the test suite.

**D4 — Export shape: nodes + edges mirroring entry kinds.**
`graph-export.schema.json` defines: `format` (constant
`portolan-adjacency`), `version`, `nodes[]`
(id, kind, vessel, key, trust, stale, anchors — the charted fields as-is)
and `edges[]` (fairway entries: from/to vessel ids, relation when charted,
anchors, trust). No timestamps anywhere: the document is arithmetic over
charted bytes; receipts carry the "when". No derived commentary either
(socratic pass 2026-09-06): a fairway endpoint whose vessel has no node is
already stated by the edge's raw from/to id — no `issues[]` list, no
invented nodes, and no top-level `vessels` rollup (every node carries
`vessel`; the list is one derivation away). Alternative: adjacency lists
per node — rejected: re-shapes the Chart and loses fairway fields.

**D5 — `chart.export` reuses the neighborhood budget machinery.**
Read-only (no chart mutation; the tool's whole write is one log receipt),
records+bytes budget like `chart.neighborhood` with its own documented
defaults, loud truncation naming omitted vessels and counts, honest error on
an absent Chart. Registry grows fourteen → fifteen; `skill/` and adapters
docs that say "fourteen" get updated in the same change (grep-count task).

**D6 — CLI rides the same core function.**
`portolan export [--target <root>]` — JSON to stdout; non-zero exit on the
honest error. The monopackage bin already dispatches
`serve|chartroom|harbor`; `export` is a fourth verb over the same function
the tool calls, so MCP and CLI cannot diverge. No `--out` file mode
(deferred, see Deferrals): stdout plus shell redirection reaches any
consumer, and a standing artifact file is the passive-surface shape Insight
3 indicts.

**D7 — Types are generated from the schemas; schema wins.**
`core/src/types.ts` splits: runtime constants (e.g. `TRUST_LABELS`,
`ENTRY_KINDS`) stay hand-written but get a deterministic test pinning them
to the schemas; the entry/anchor/receipt TS types are generated whole from
the schema files by a checked-in script (`scripts/gen-types.ts`, dev-time
only). Doc comments move into schema `description` fields so the generator
carries them — no header-surgery machinery. CI runs the generator and fails
on uncommitted drift — the mirror becomes mechanical. Alternatives: keep a
hand mirror + fixture tests — rejected: that is the drift this change
exists to end; drop the TS types and use `JsonExpr`-style inference —
rejected: the mirror serves every call site today.

**D8 — Documentation is part of the format.**
One page, `docs/formats.md`: the versioning policy up top, then a section
per format (purpose, schema path, current version, stability promise); one
validation snippet on the page, not per section (four copies would drift).
No marketing prose: the page is a contract, and every claim in it is about
the schemas, not about adoption.

## Risks / Trade-offs

- [The bet itself is judgment, not evidence] → Scope stays S–M, no
  packaging/site spend; further investment waits for a real consumer
  (Governor's gate, per the backlog's Insight-7 caveat).
- [Cross-file `$ref` raises the bar for external validators] → Both files
  ship together; docs show the two-line ajv registration; if a consumer
  chokes, bundling the vocabulary inline is an additive 0.x-patch escape
  hatch that keeps the standalone file authoritative.
- [Historical receipts might not fit the first receipt schema] → D3 makes
  the writer authoritative; the suite validates every existing line, so a
  mismatch fails in CI, not at a consumer.
- ["Fifteen" ripples through docs/skill counts] → Grep sweep task before
  merge; the numbers live in few places (MANIFEST, adapters README, skill).

## Migration Plan

Additive only: schema files gain/appear, one tool registers, CLI gains a
verb, docs land. No data migration; rollback is reverting the branch. At
merge: `@portolan/core` version bump + CHANGELOG entry per standing rules.

## Open Questions

None blocking. The generator library choice for D7 (e.g.
json-schema-to-typescript vs a hand-rolled binder) is a task-level pick
among equivalents; either satisfies "CI fails on drift".

## Deferrals (socratic pass, 2026-09-06)

Advised deferrals applied: `--out` file mode of the CLI (D6) until a
consumer asks; four documentation pages collapsed to one page with four
sections (D8); per-section validation snippets reduced to one; the
records half of the export budget dropped in favor of bytes alone (the
export takes no query parameters to cap); the `issues[]` dangling-endpoint
list and top-level `vessels` rollup cut from the export shape (D4 — raw
edge ids already state the fact); the `$id`-stability release test dropped
(D1 makes it true by construction); the generated-types header-surgery
machinery cut in favor of descriptions-in-schemas (D7).

Advised deferral declined: pushing the trust vocabulary into an inline enum
until a consumer validates labels in isolation. The four named formats —
among them the trust vocabulary as its own schema file — are a decision
settled with the Governor in grilling (2026-09-06), and the specs' "single
source" requirement rules out a second inline copy policed only by an
equivalence test. The `$ref` wiring is the mechanism that keeps one source.
