## Context

See proposal.md — Why. The repo is greenfield: only docs/MANIFEST.md, the
sea-trial draft, and openspec scaffolding exist. This change creates
`core/`, the TypeScript/Bun package every later change builds on. The
manifest locks the glossary, trust vocabulary, and the "model is the
cartographer; determinism only verifies" split.

## Goals / Non-Goals

**Goals:**

- A typed chart ontology (vessels, fairways, ports of entry, beacons,
  lights, dangers; anchors; trust labels) with a machine-checkable schema.
- A chart store implementing the spec deltas above: validation, atomic
  writes, per-vessel source signatures, notices.
- Enough tests to trust the deterministic core forever after.

**Non-Goals:**

- Any source-code parsing (manifests are another change; language parsing
  is a non-goal of the whole product).
- MCP serving, skills, adapters, the sea-trial runner (later changes).
- Any UI. If a human wants to look, they read markdown and git diff.

## Decisions

1. **JSON Schema (draft 2020-12) + `ajv` as the single validator.**
   Alternative: hand-written TypeScript guards — rejected: the schema file
   doubles as the published contract for Cartographer agents; one source of
   truth beats two. `ajv` is the only dependency added.
2. **Sheets are markdown with a fenced header block; `index.jsonl` is the
   machine layer.** The index is append-oriented JSONL (one entry per line)
   so expedition updates are small, diffable line edits. Alternative: a
   single `index.json` — rejected: whole-file churn on every correction
   kills reviewability. The store derives/validates the pair together; the
   index is authoritative for machines, sheets for humans.
3. **Vessel source signature = cheap tree hash** (file list + sizes + mtimes
   under the vessel's paths, hashed). Alternative: content SHA-256 per file
   (v2 staleness did this) — slower; tree hash is enough to flip
   `pending correction`, and the repair expedition re-reads content anyway.
4. **Atomicity by write-to-temp + rename** for the index and each touched
   sheet, batched per write call. Alternative: journal/CRC machinery —
   rejected as YAGNI; rename is atomic on the target OS families we care
   about.
5. **Bun + `bun test` from day one; TypeScript strict.** No framework, no
   bundler, no linter config yet (add when there is code volume worth
   linting).

## Risks / Trade-offs

- [Tree hash misses content-only edits at identical size and mtime] →
  Accept: rare in practice; the sea trial's staleness check edits real
  files; can upgrade to content hashing without changing the spec.
- [Markdown header block drifts from index entries] → Store renders sheets
  from entries on write; hand-edited sheets are overwritten on next
  expedition — documented behavior, sheets are outputs.
- [ajv is the only dep and drags in formats] → Compile a minimal build; if
  install weight hurts, codegen a validator from the schema later —
  contract unchanged.

## Migration Plan

Greenfield; no migration. Rollback = delete `core/`.
