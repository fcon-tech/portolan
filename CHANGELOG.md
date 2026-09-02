# Changelog

## 0.4.4 — 2026-09-02

Hook wiring parked (openspec change `hook-wiring-parked`): the client's
workspace hook trust review renders its items but they are not actionable
for remote workspaces, so the `process-hooks` wiring sat inert behind a
dead prompt in every session. The tracked `.zcode/config.json` is removed
— the guards stay at `scripts/hooks/` with their tests, and the restore
path (the archived wiring spec, or the deleted file in git history) is
recorded in `docs/workflow.md`. Hooks are repo-scoped by principle: a
user-scope workaround was offered and declined. No product behavior
changes; no core code touched.

## 0.4.3 — 2026-09-02

Process hooks (openspec change `process-hooks`): the repo's disciplines
gained deterministic guards at the moment of the event, not just at merge
time. Soft phase — hooks warn, never block; CI stays the final bar. No
product behavior changes; no core code touched.

- **H1 leak-stamp** (`scripts/hooks/leak-stamp.sh`, after Edit/Write):
  flags the touched file when it carries a leak-gate signature — the
  failure class a task review caught in `process-fabric` only after the
  fact. The signature list stays single-homed in `scripts/leak-gate.sh`
  (`--print-patterns`, now stdout).
- **H2 harbor-marker reminder** (`scripts/hooks/harbor-markers.sh`, before
  Edit/Write on the root AGENTS.md): the block between the harbor markers
  is installer-owned and hand edits are reverted on install.
- **H3 quiet session brief** (`scripts/hooks/session-brief.ts`,
  SessionStart): the harbor queue and the active changes, injected only
  when something is to say.
- **Wiring**: tracked `.zcode/config.json` (`hooks.enabled: true`). The
  spike could not confirm workspace-config loading from inside one
  session — wiring is inert if never loaded; live confirmation is the
  spike's next-session checklist. Escalation to deny is recorded in the
  change's design D1, trigger-gated.

## 0.4.2 — 2026-09-02

Verify-first made explicit (openspec change `verify-first`): the
`process-fabric` cycle normalized a silent TDD skip — no spec deltas meant
no test-writer and no red step, with the skip living only in task reports.
The protocol now owns the discipline. No product behavior changes; no core
code touched.

- **The rule** (AGENTS.md, one line): verification is written before the
  work, and a skipped test-first pass is a recorded decision in the task
  report — what was skipped, why, what covers it instead — not a default.
- **The procedure** (`docs/workflow.md` J4): tasks with spec deltas get
  failing acceptance tests from those deltas before implementation
  (test-writer, then implementer); tasks without deltas restate their
  verify line as checks run before the work — red where the work is
  absent. The change's own task reports are the first exemplars of the
  recorded-skip shape.

## 0.4.1 — 2026-09-02

The operating protocol assembled (openspec change `process-fabric`): the
repo's two systems — the OpenSpec cycle and the Portolan province — now
share one process document and one session briefing. No product behavior
changes; no core code touched.

- **`docs/workflow.md` owns the joints**: the unified session briefing
  (harbor queue first, then the `openspec list` state, one decision
  round; the installer-owned AGENTS.md block stays the harbor half's
  short authority), the routing rule (product behavior → the OpenSpec
  cycle, Chart and archive state → an Expedition, with the
  expedition→change hand-off as its worked example), the merge-to-repair
  loop named as a survey event, and the one role fact — the Cartographer
  is the main agent's stance (`skill/SKILL.md`), not a subagent role.
- **`AGENTS.md` slims to rules and pointers**: the OpenSpec workflow
  section collapsed to the cycle rules, the merge-time version-bump
  rule, and a pointer; the installer-owned harbor block byte-identical.
- **Drift repaired on sight**: `spec/invocation` received the real
  `## Purpose` its archive left as a placeholder — the strict spec
  validation CI gates on is green again.

## 0.4.0 — 2026-09-02

The re-survey queue (openspec change `resurvey-queue`, backlog candidate
C3's queue half — the "pending correction" property itself already
shipped in 0.2.0/0.3.0): what to re-survey first is now a served,
ranked answer instead of one grouped row.

- **Repairs propose per vessel**: the single grouped repair proposal
  became one proposal per pending-correction vessel — evidence
  `vessel/<id>#<stale-entry-count>`, an anchor under that vessel's
  charted paths, scope charged by the report's attribution rule.
  Declining one vessel no longer hides the others, and a refusal holds
  only while that vessel's drift is unchanged: the count in the evidence
  reopens the proposal when the drift grows or shrinks.
- **Repairs rank by charted fan-in**: repair rows order by direct
  cross-vessel charted fan-in (the fairways landing on the vessel from
  other vessels), highest first, vessel id breaking ties — arithmetic
  over charted bytes, shared with `trust.report`, deliberately not the
  neighborhood's per-entry count (internal traffic ranks nothing).
- **The night bound spends cumulatively**: the watch auto-executes
  repair rows in queue order until `harbor.auto_repair_max_vessels` is
  spent — the highest-ranked coasts first — instead of the old
  all-or-nothing on one grouped row. A launch attempt spends the bound
  whether or not the launch succeeds.
- **`trust.report` speaks with the queue's voice**: the pending-vessel
  list carries the same rank's order; membership unchanged (a stale
  fairway still drags on both its endpoints).
- Security notes recorded in the change's design.md: the reopen signal
  is chart-derived (gameable by index edits, class-equivalent to before),
  the cumulative bound is fail-spend on never-healing drift, duplicated
  index rows can pump rank and counts — each with a recorded kill-trigger.

## 0.3.1 — 2026-09-01

The hygiene sweep: two whole-tree code reviews and an adversarial security
audit over the repo, every finding fixed or deferred with its reason. The
change also fixes how the codebase writes itself down:
[docs/engineering.md](docs/engineering.md) locks the architecture, style,
and YAGNI/KISS/DRY conventions the code already follows, and the
permissions capability becomes a living spec.

- **The province perimeter holds for every read** (2 HIGH, reproduced
  end-to-end): `manifests` and the `sound.edge` walks read agent-cited
  paths uncontained, so `..` segments and in-target symlinks reached any
  file on the machine. Containment lives once in `core/src/perimeter.ts`;
  an escaping path is reported, never read.
- **Chart-controlled strings render as text, never markup** (1 HIGH,
  1 MEDIUM): the Chart Room and fleet-review view builders escaped
  nothing, so a charted note with `<img onerror=…>`, publishable to the
  site via demo-refresh, executed at view time. Every interpolation now
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
- **Staleness recomputes instead of accumulating**: a reverted drift clears
  its pending-correction mark (chart spec: unchanged sources MUST NOT be
  marked), and a symlinked vessel root is never provably fresh.
- **Harbor hardening**: repair anchors cite a soundable regular file under
  the drifted tree (directories are refuted by `sound.anchor`, so the
  handed brief no longer refutes true drift at first sounding); the
  landscape snapshot writes stage-and-rename like the chart; ship's-log
  appends serialize on a lock so two processes cannot mint duplicate
  receipt ids; new-land proposals carry their display path instead of
  chat-format re-parsing evidence keys.
- **Review minors**: `sweep`/`symbols` share one path-normalization rule;
  the neighborhood schema quotes the engine's own constants; the maxBytes
  budget is measured on the served pretty-printed JSON; `requireTrustLabel`
  leaves production (test-only guard); `render --target a --target b` is a
  usage error; the opencode installer writes the operator config
  atomically; leak-gate flags a tracked `$USER`; the expedition launcher
  frames the proposal as a delimited data block, not prose instructions.
- **Deferred with reasons**: the realpath-then-open window in soundings
  (needs a local process racing the survey; revisit for multi-user or
  remote provinces), and concurrent watch/run invocations over one province
  (the append-only history keeps the audit verifiable; a double launch is
  visible in it).

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
