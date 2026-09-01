# Changelog

## 0.3.1 — 2026-09-01

The hygiene sweep: two whole-tree code reviews and an adversarial security
audit over the repo, every finding fixed or deferred openly. Also fixes how
the codebase writes itself down — [docs/engineering.md](docs/engineering.md)
locks the architecture, style, and YAGNI/KISS/DRY conventions the code
already follows, and the permissions capability becomes a living spec.

- **The province perimeter holds for every read** (2 HIGH, reproduced
  end-to-end): `manifests` and the `sound.edge` walks read agent-cited
  paths uncontained — `..` segments and in-target symlinks reached any
  file on the machine. Containment lives once in `core/src/perimeter.ts`;
  an escaping path is reported, never read.
- **Chart-controlled strings render as text, never markup** (1 HIGH,
  1 MEDIUM): the Chart Room and fleet-review view builders escaped
  nothing, so a charted note with `<img onerror=…>` — publishable to the
  site via demo-refresh — executed at view time. Every interpolation now
  routes through `esc`; the hosted demo artifacts are re-rendered.
- **One planted anchor cannot sink `trust.report`**: a hand-edited index
  with a non-citable anchor crashed the whole report; it now counts as
  refuted with the refusal named, like `chart.neighborhood` already did.
  The committed receipt redacts what soundings found (quoted secrets
  included) and reports the adoption block with its zeros.
- **A persisted write never fails in its cleanup**: retired-sheet deletion
  after the atomic rename reported tool errors for writes that had in fact
  landed; cleanup failures surface as `cleanupError`. The 75% shrink floor
  compares as a float, so a 74.9% shrink is refused as the spec says.
- **Staleness recomputes, never accumulates**: a reverted drift clears its
  pending-correction mark (chart spec: unchanged sources MUST NOT be
  marked), and a symlinked vessel root is never provably fresh.
- **Harbor hardening**: repair anchors cite a soundable regular file under
  the drifted tree (directories are refuted by `sound.anchor` — the handed
  brief no longer refutes true drift at first sounding); the landscape
  snapshot writes stage-and-rename like the chart; ship's-log appends
  serialize on a lock so two processes cannot mint duplicate receipt ids;
  new-land proposals carry their display path instead of chat-format
  re-parsing evidence keys.
- **Review minors**: `sweep`/`symbols` share one path-normalization rule;
  the neighborhood schema quotes the engine's own constants; the maxBytes
  budget is measured on the served pretty-printed JSON; `requireTrustLabel`
  leaves production (test-only guard); `render --target a --target b` is a
  usage error; the opencode installer writes the operator config
  atomically; leak-gate flags a tracked `$USER`; the expedition launcher
  frames the proposal as a delimited data block, not prose instructions.
- **Deferred openly**: the realpath-then-open window in soundings (needs a
  local process racing the survey; revisit for multi-user or remote
  provinces), and concurrent watch/run invocations over one province (the
  append-only history keeps the audit honest; double-launch is visible).

## 0.3.0 — 2026-09-01

The neighborhood query — structural navigation as a served tool (OpenSpec
change `chart-neighborhood`): the question "what does X touch?" moves from
Chart Room browser JS (a passive surface) to the fourteenth MCP tool,
shipped only with its invocation contract because an uninvoked tool is
worth zero.

- **`chart.neighborhood`** — one vessel in, the anchored neighborhood out:
  fairways in the requested direction to the requested depth (≤ 3,
  cycle-safe), each edge with anchors, trust label, optional relation, and
  staleness; touched vessels with their ports of entry; ranked by direct
  fan-in and greedily packed into a records+bytes budget that states its
  cuts (`truncated`, `droppedEdges`, `droppedVessels`); the queried vessel
  is always present. Honest `unsurveyed` error for a vessel not on the
  Chart. Each call appends its own ship's-log receipt.
- **On-demand verification**: `verify: true` re-sounds every returned
  edge's anchors; unresolvable or anchorless edges are refuted by name,
  never confirmed on zero soundings.
- **Invocation contract** (new `invocation` capability): the skill
  mandates the call at session start — a task touching more than one file
  or vessel requires the neighborhood of each touched vessel before the
  first edit; `trust.report` gains an `adoption` block reporting per-tool
  invocation counts with first/last receipt ids — invocation facts, not a
  compliance measurement.
- **Typed fairways**: optional `relation` enum `build | runtime | config`
  on fairways, recorded when evidence shows it; untyped stays valid.
- **Bigtop leg**: a corpus-guarded integration test (`PORTOLAN_BIGTOP_
  CORPUS` env; skips in CI without it) proves hub ranking, loud
  truncation, and refutation of a planted anchor on the real chart.
  Evidence discipline: navigation direction `measured` (one controlled
  ablation, one corroborating preprint); magnitudes stay `doubtful`; the
  Bigtop-scale localization effect remains `unsurveyed`.
- Spec deltas applied to `tools`, `chart`, `invocation` (new), `harness`.

## 0.2.0 — 2026-08-31

Verification as the product spine (OpenSpec change `verification-spine`):
the properties Portolan always enforced — anchors, trust labels, receipts,
staleness — become the marketed, queryable product surface.

- **`trust.report`** — the thirteenth MCP tool: one call returns the
  province's verification summary — trust-label distribution, per-kind
  counts, staleness refreshed first, every chart anchor re-sounded
  deterministically with refuted ones named verbatim, ship's-log tail.
  Read-only; no input; deterministic on an unchanged province.
- **Sailing Directions** carry the verification summary; the skill mandates
  calling `trust.report` for the brief, and refuted anchors are reported,
  never smoothed over.
- **Positioning with receipts**: README and the landing page state the
  verification spine, every differentiation claim anchored to committed
  receipts — the self-chart report (`docs/demo/trust-report.md`) and the
  dated competitor trials (`docs/verification-trials.md`, Serena &
  Sourcegraph MCP: no surveyed tool markets the combination).
- **Security hardening**: anchor soundings and staleness walks now refuse
  to read past the target perimeter (realpath containment, symlink-safe);
  the receipt renderer is injection-safe and redacts inline secrets.
- Spec deltas applied to `tools`, `expedition`, `harness`; glossary gains
  the trust report (верификационная сводка).
