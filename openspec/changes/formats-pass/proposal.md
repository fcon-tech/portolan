## Why

Backlog candidate C5 ("formats as the interface bet"): the mechanical stack
Portolan wraps (tree-sitter → graph → MCP) is commoditizing on a clock
(CodeLayers, Depwire, a crowd of graph MCP servers; IDE bundling from above),
so the durable asset is not chart-building but the data model — anchor-verified
edges, trust labels, receipts, staleness (research Insight 7; category facts
`charted`, the strategic inference is judgment). That asset only has value if
it becomes an interface others can adopt, and today it cannot be adopted: the
chart schema carries no version, the trust vocabulary lives as an enum inside
the schema and a table in MANIFEST, the receipt shape (`log.jsonl`) is named
nowhere, and no graph export exists — `chart.neighborhood` is a budgeted
query, not an artifact, and the Chart Room is human-facing HTML. Grilling with
the Governor (2026-09-06) settled scope and policy; see design.md.

## What Changes

- **Four named, versioned formats**, each a JSON Schema file under
  `core/schema/` carrying `"version": "0.1.0"` and a stable `$id`:
  the chart entry schema (existing `chart.schema.json`, now versioned), the
  trust vocabulary (extracted as its own named schema), the ship's-log
  receipt schema (new — names the shape `log.jsonl` already writes), and
  the adjacency graph export (new). Data files (`index.jsonl`, `log.jsonl`)
  do not change shape in 0.1.0.
- **Versioning policy**: semver starting at `0.1.0`; while on 0.x, breaking
  changes bump the minor, additive changes bump the patch; declaring `1.0.0`
  is a separate Governor's decision once a format stabilizes. Versions live
  in the schema files (single source); data files stay unversioned until an
  external consumer needs self-description — the export carries it from day
  one.
- **`chart.export`, the fifteenth served tool** (read-only): returns the
  Chart as a machine-readable adjacency graph — nodes, typed edges, anchors,
  trust labels, staleness — self-describing (format name + version), derived
  from charted bytes only, with loud truncation under a byte budget, one
  ship's-log receipt per call. A thin CLI subcommand (`portolan export`,
  JSON to stdout) serves the same core function for non-MCP consumers; no
  HTML, the Chart Room stays the only human surface.
- **Formats documentation surface**: one page, `docs/formats.md` — the
  versioning policy plus a section per format (purpose, schema reference,
  current version, stability promise); no new package and no site; adoption
  is proven by consumption, not packaging.
- **One mirror to rule**: the hand-maintained `core/src/types.ts` mirror of
  the schema is resolved (generation or an enforced equivalence check —
  design.md decides) so schema and code cannot drift.

Non-goals kept: no HTML atlas (export is JSON, not the Chart Room); no npm
schema package, no site (`charted` category facts, the bet is judgment —
YAGNI until a consumer appears); no change to what the Chart itself records.

## Capabilities

### New Capabilities

- `formats`: the format contract — the four named formats, their versioning
  policy and stability promise, and the rule that the export renders charted
  truth only.

### Modified Capabilities

- `tools`: ADDED requirement — `chart.export` joins the served tools as the
  read-only adjacency export with self-description, budget, and receipts.
- `harness`: MODIFIED requirement — the advertised toolset grows to
  fifteen: `chart.export` joins the served list.
- `distribution`: MODIFIED requirements — the served-tool count the
  clean-install and install-path scenarios pin moves fourteen → fifteen.

## Impact

- `core/schema/` — versions added; `trust-vocabulary.schema.json`,
  `receipt.schema.json`, `graph-export.schema.json` new; `$id`s stay on the
  `portolan.dev` identifier space (identifiers, not a live site).
- `core/src/server/registry.ts` — one more served tool (fourteen → fifteen).
- `core/src/validate.ts`, `core/src/types.ts` — register the vocabulary
  schema beside the chart schema; types generated from schemas (design D7).
- CLI (`bin` in `package.json`) — `portolan export` subcommand over the same
  core function.
- `docs/formats.md` — new; `docs/MANIFEST.md` tool table gains one row
  (`chart.export`) at implementation time.
- At merge: `@portolan/core` version bump + CHANGELOG entry (standing rule).
