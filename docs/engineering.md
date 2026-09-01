# Engineering practices

Locked 2026-09-01. This document fixes how code in this repository is
written: architecture, style, and the working ladder of YAGNI / KISS / DRY /
clean code. These are the conventions the codebase already follows, written
down so they survive contributor turnover and model turnover.

Precedence when documents conflict: docs/MANIFEST.md (the product contract)
→ living specs (`openspec/specs/`) → AGENTS.md (workflow and working
principles) → this file. This file operationalizes the higher documents; it
never overrides them. Repair drift on sight.

Practices here stay lightweight by contract (MANIFEST, "Dropped from v2"):
no Clean-Architecture / TDD-ceremony / BDD ritual. What is not lightweight
is the product's honesty contract — every claim carries an anchor and a
trust label — and verification (AGENTS.md, "Verification"). A practice that
makes honesty cheaper to keep stays; one that adds ceremony goes.

## 1. Architecture: deep modules at named seams

Vocabulary, used exactly and without synonyms: **module** (anything with an
interface and an implementation), **interface** (everything a caller must
know: signature, invariants, error modes), **depth** (behaviour per unit of
interface a caller must learn), **seam** (where a module's interface lives —
behaviour can vary there without editing either side), **adapter** (a
concrete occupant of a seam).

The repo's seams, and the rule each carries:

| Seam | Adapters | Rule |
| --- | --- | --- |
| core ↔ external binaries | ripgrep (`sweep`), ctags (`symbols`) | wrap, don't build (MANIFEST); a missing binary is a named refusal, never an improvised substitute (`MissingBinaryError`) |
| core ↔ harness | opencode plugin, pi/omp shims (`adapters/`) | zero harness-specific code in core; adapters stay thin shims |
| consumers ↔ the Chart | `chart-store` (index.jsonl + rendered sheets) | every write goes through `writeChart` — validate, then atomic stage-and-rename; no consumer assembles chart files by hand |
| harbor ↔ expedition launchers | `adapters/opencode/expedition-launcher` | the launcher is an argv template supplied by the caller; the harbor assumes nothing about which |
| registry ↔ served tools | the `ToolSpec` table (`core/src/server/registry.ts`) | a new tool is one table entry, never a server redesign |

Rules:

- **Deep, not layered.** Much behaviour behind a small interface. A module
  whose interface is as complex as its implementation is a pass-through:
  apply the deletion test — delete it, and if its complexity just reappears
  across the callers, it was never earning its keep.
- **One adapter is a hypothetical seam; two are a real one.** Do not
  introduce an interface for variation that does not vary.
- **Accept dependencies, don't create them.** PATH, env, target root, the
  clock: parameters, not globals captured deep inside
  (`findBinary(name, env = process.env)`).
- **Return results; concentrate side effects.** Pure computation first;
  writes last, in one place (`writeChart` returns a `WriteResult`).
- **The interface is the test surface.** Tests cross the same seam callers
  do. A test that must reach past the interface is a design smell — fix
  the module's shape, not the test.
- **Internal seams are fine.** Small private parts inside a deep module are
  good; they are simply not part of the interface.

Layering: `core/src/tools/` and the root modules compute; `core/src/server/`
wires and enforces the boundary; `core/src/harbor/` and `core/src/chartroom/`
are sibling consumers of the chart store; `adapters/` may depend on core,
never the reverse; `skill/` and `acceptance/` depend on served behaviour,
not on internals.

## 2. Code style (TypeScript on Bun)

- **Module header.** Every source file opens with a block comment stating
  what the module is, the invariant it owns, and the spec or decision it
  serves (`specs/tools/spec.md`, `design.md, decision 4`). A comment states
  a constraint the code cannot show — a why-guard, an incident receipt, a
  spec pointer — never a narration of the next line.
- **Closed vocabularies.** Domain enums are `as const` arrays with a derived
  union type (`TRUST_LABELS`, `ENTRY_KINDS`, `FAIRWAY_RELATIONS`); bare
  string literals never stand alone in logic; a `switch` over a closed
  vocabulary is exhaustive (`formatAnchor`).
- **One error type per layer, surfaced verbatim.** `ToolInputError`,
  `MissingBinaryError`, `LogError`, `SoundingError`, `HarborError`. The
  registry boundary turns a thrown rejection into a tool error without
  reinterpretation. Error messages state what happened **and what was not
  done** ("no substitute search was attempted").
- **Refuse, don't improvise.** Missing binary, empty write, a full-replace
  that would shrink the chart: refuse loudly, name the reason, and where an
  override exists, name it (`allowShrink`).
- **Strict argument readers.** Tool and CLI arguments are checked, never
  coerced — the `reqString` / `optInt` readers of `registry.ts`.
- **Naming.** Domain concepts use the locked glossary (MANIFEST): vessel,
  fairway, port of entry, beacon, light, danger, notice. No synonyms, ever.
  Everything else takes plain technical names; no abbreviation that needs a
  legend.
- **Tests.** Colocated `*.test.ts` under `bun:test`. A test asserts the
  scenario through the public interface; the real thing over a mock when
  the real thing is cheap (fs and processes are cheap under Bun); assertions
  carry messages so a failure names the broken expectation. Test setup may
  duplicate; production knowledge may not.
- **Dead code is deleted, not commented out.** Git remembers.

## 3. The working ladder: YAGNI → KISS → DRY → clean code

Before adding any new entity — module, layer, abstraction, option, config
key — walk the ladder and stop at the first rung that holds:

1. Does it need to exist at all? (YAGNI)
2. Does the codebase already have it? — reuse it
3. Does the standard library do it? — use it
4. Does the runtime do it natively? — use it
5. Does an installed dependency do it? — use it
6. Can it be one line? — one line
7. Only then: the minimum that works (KISS)

- **YAGNI.** No speculative generality: no abstraction with a single
  caller, no option nobody sets, no branch for a case no scenario names.
  Deferred work is recorded as deferred (MANIFEST defers the C4 entry kind
  in prose, not in scaffolding).
- **KISS.** The minimum that works. Laziness applies to the solution, never
  to validation, error handling, security, or the honesty contract — those
  are never "extra".
- **DRY.** One authoritative definition per fact: the JSON Schema owns
  shape, `core/src/types.ts` owns the ontology, living specs own behaviour;
  generated outputs (vessel sheets, Chart Room HTML) derive from the index
  and are never hand-edited.
- **Clean code.** Functions do one thing; side effects sit at the edges;
  docs and charts carry anchors and trust labels, and invariant-bearing
  code comments carry spec pointers instead of prose.

## 4. Verification is the bar

Nothing is declared done until the block in AGENTS.md ("Verification") runs
green: `bun test`, `tsc --noEmit` in core and in acceptance,
`openspec validate --specs --strict`, the expedition-skill checks, the leak
gate. Claims are reported with evidence labels — `verified` /
`not_assessed` / `assumed` / `blocked` / `failed` — and never
self-certified: the Governor delivers the verdict.

The repo charts itself. Sources changed since the last survey put their
vessels `pending correction`; the harbor watch proposes the repair at
session start, and the self-chart under `.portolan/` is corrected from that
proposal — extend what stands, never redraw. The committed trust-report
receipt (`docs/demo/trust-report.md`) is refreshed whenever it would
otherwise state numbers that no longer hold.
