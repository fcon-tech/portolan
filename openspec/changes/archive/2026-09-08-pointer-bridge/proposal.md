## Why

The AGENTS.md pointer block — the one generated text surface the backlog
evidence allows (file as pointer, MCP as truth; instructions are the one
channel agents obey) — already exists in minimal form: the opencode installer
has written it since 2026-08-25. But it has one writer (the installer), no
version, and no verification, and the rot the design law predicts has already
happened in our own province: the committed block was hand-edited and now
diverges from what the installer emits. Backlog C10 is the promotion of this
block from an installer side effect to a product-owned, versioned, verified
artifact (Governor's decisions 2026-09-07, the full design tree).

## What Changes

- **New capability `pointer`**: one template owned by core (single source;
  skill name derived from the skill's frontmatter); the block is the
  self-describing text format `portolan-pointer` at `0.1.0` (markers + a
  version line; the version is the format version, never the package
  version); two new bin subcommands — `portolan pointer` (prints the block,
  no receipt) and `portolan install` (routes to the harness installer — the
  front door gains a handle); lifecycle — the installer writes it at install,
  the Cartographer verifies it at expedition close-out (silence when current,
  rewrite + ship's-log receipt when stale or missing); the Pointer status
  (current / stale / missing / unparseable) is a reported fact line in
  `trust.report` and in `expeditions.propose` — never a queue input; block
  content stays a mandate list (session-start propose, one-message queue
  decision, chart-first Q&A with anchors and trust labels, the
  `chart.neighborhood` trigger, the `.portolan/` boundary, the bootstrap
  line) — it never summarizes the codebase.
- **formats**: a fifth named format — the pointer, defined as a text format
  by its documentation section and the core version constant (no JSON
  Schema); the "version lives only in the schema file" rule gains the
  self-describing exception (the pointer block carries its version line, as
  the adjacency export already carries its version field).
- **permissions**: one explicit exception to the write perimeter — the
  Cartographer writes the Pointer block into `<target>/AGENTS.md` between
  the markers, as the skill mandates; target sources stay untouched.
- **expedition**: the perimeter clause and its scenario name the same
  Pointer exception.
- Installer imports the core template; ownership language updated
  (`scripts/hooks/harbor-markers.sh`, `docs/workflow.md`); our own
  AGENTS.md block regenerated from the template (the live divergence is
  closed by the change itself).
- Docs: `docs/formats.md` gains the pointer section (and stops calling the
  adjacency export's version field "the only one"); MANIFEST gains the
  glossary row **Pointer / Указатель** and a first-run-contract mention.

## Capabilities

### New Capabilities
- `pointer` — the AGENTS.md Pointer: template ownership, format version,
  CLI surfaces, expedition lifecycle, status reporting, content contract.

### Modified Capabilities
- `formats` — five formats; the pointer as a documentation-defined text
  format; the version-location rule's self-describing exception.
- `permissions` — the write perimeter names the Pointer exception.
- `expedition` — the perimeter clause and its scenario name the Pointer
  exception (the close-out behavior itself is owned by `pointer`).

## Impact

- `core/src` — new pointer module (template, version constant, status
  parse); bin dispatcher (two subcommands); `trust.report` and
  `expeditions.propose` outputs gain one status line each. No new MCP tool;
  the receipt format is untouched (the `command` field is open).
- `adapters/opencode/install.ts` — imports the core template; behavior
  (idempotent replace, orphan-marker cleanup) preserved; tests updated.
- `skill/SKILL.md` — close-out Pointer step, perimeter exception, approval
  wording.
- `scripts/hooks/harbor-markers.sh`, `docs/workflow.md` — ownership
  language.
- `docs/formats.md`, `docs/MANIFEST.md`, this repo's `AGENTS.md`.
- Security review required: the change writes a file outside
  `.portolan/`, adds an install command, and instructs agents to run it.
