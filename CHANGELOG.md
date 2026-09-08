# Changelog

## 0.7.0 — 2026-09-08

The Pointer (openspec change `pointer-bridge`, backlog C10): the
marker-delimited block a charted province's `AGENTS.md` carries is promoted
from an installer side effect to a product-owned, versioned, verified
artifact — the one generated text surface the backlog evidence allows (file
as pointer, MCP as truth; instructions are the channel agents obey, passive
overviews rot). The rot the change kills was live in this repo: the
committed block had been hand-edited away from what the installer emits,
with no version and no verification to say so.

- **One template, one version.** `core/src/pointer` owns the block's single
  source; the opencode installer and the new `portolan pointer` command
  render byte-identical blocks from it. The block is the fifth named
  format, `portolan-pointer 0.1.0` (a text format — markers plus a
  dedicated version line, documented in `docs/formats.md`; no JSON
  Schema). The version is the format's, never the package's: a package
  release never stales a single province.
- **The front door gains a handle.** `portolan install --target <t>` routes
  to the harness installer — previously reachable only from a checkout by
  an internal path — and the block's bootstrap line names the runnable
  form (`bunx --package @fcon-tech/portolan portolan install --target .`)
  so a visitor without the tools has one command, not a labyrinth.
- **The expedition keeps the Pointer current.** The skill's close-out step
  compares the block against the fresh render — version line and bytes; a
  hand-edit with an intact version line is still stale, exactly the
  incident that motivated the change. Current buys silence; stale is
  replaced and receipted (`pointer install` — found version, set version,
  file); a province with no `AGENTS.md` reports `missing` and is left to
  install — the close-out never creates a top-level file.
- **The status is a reported fact, never a queue input.** `trust.report`
  and `expeditions.propose` carry the same Pointer status — `current` /
  `stale` / `missing` / `unparseable` / `unreadable` — so the front door
  verifies itself at the moment of use. Reads are perimeter-bounded
  (escaping symlink, non-regular file, or oversized `AGENTS.md` reports
  `unreadable` with a reason instead of crashing or lying); a forged
  second marker pair reads `unparseable` and placement collapses it.
- **The write perimeter has one named exception.** The Cartographer places
  and refreshes the Pointer block in `<target>/AGENTS.md` between the
  markers — the single write an expedition makes outside `.portolan/`,
  pre-disclosed in the one approval, receipted in the ship's log. The
  block's own boundary mandate carries the exception. The installer
  refuses to place through a symlinked `AGENTS.md`.
- **Honest limits.** The Pointer's effect on invocation stays `unsurveyed`
  (no A/B; the underlying instruction-channel evidence is one unreplicated
  study); receipts count installs, not mandate compliance. The unpinned
  bootstrap command is a recorded accepted risk with a trigger
  (design.md): any npm account or scope anomaly puts pinning to the
  Governor.

## 0.6.0 — 2026-09-06

The expedition charter (openspec change `expedition-charter`): what an
expedition promises is on record before the work begins, what it did between
promise and answer is derivable from receipts, and a repair need outside the
promise gets a legitimate route into the queue instead of a silent fix. Born
of a real overreach — the 2026-09-06 core repair corrected 42 entries against
a 27-entry, one-vessel charter while its instructions said not to; the failure
was invisibility, not absence of enforcement.

- **Charters are a receipt pair.** An expedition records a start receipt
  (`log.append`, `meta.kind: "charter"` — the vessels and entries it
  promises, taken from the proposal's scope) before its first chart write,
  and closes with an outcome receipt (`meta.kind: "charter-outcome"`,
  naming the start) when it ends. No new tool, no new file: the ship's log
  already receipts every command, and the markers ride the free-form `meta`
  the formats-pass receipt schema admits.
- **Overreach is computed and loud, never prevented.** Served `chart.write`
  receipts name the write's delta (`meta.vessels` — per-vessel entry counts
  over the changed entries, not the whole post-write chart), and one shared
  arithmetic lists out-of-charter writes by vessel and entry count in both
  the watch report and `trust.report`. A kept charter reads as kept; a
  broken one is named vessel by vessel. Writes are never blocked — a broken
  charter just cannot be invisible.
- **Flares are the fourth deterministic queue input.** An out-of-charter
  repair need is filed as a receipt (`meta.kind: "flare"` — vessel, stated
  reason, evidence) instead of being fixed silently; every open flare
  proposes as a repair row for the vessel it names, its reason riding the
  row's evidence, folded into the drift row when the vessel has both.
  Closure is arithmetic over the harbor history: a decision — accepted or
  declined — recorded after the flare closes it, and undecided flares keep
  proposing. The decide paths record the decided row's evidence keys, and
  closure matches that recorded evidence — monotonic, so a flare its
  decision answered cannot resurrect when the drift charge later empties;
  history rows written before the amendment fall back to the mined
  arithmetic. Flare-only rows are vessel-scoped (the count-less
  `vessel/<id>` evidence key), so declining one vessel's row can never close
  another vessel's flare whose reason text coincides. Flare rows are repair
  rows for every other purpose — same rank, same decisions, same night
  bound; that is a stated non-change, not an oversight.
- **The surfaces teach it**: the expedition launcher brief carries the
  charter line derived from the proposal's scope; `skill/SKILL.md` gains the
  method steps (charter at start, flare on out-of-charter finds, outcome at
  end); the glossary gains Charter/Чартер and Flare/Ракета.
- **Honest limits, stated in the spec itself**: receipts are agent-written
  facts — detection is arithmetic over an honor system, and the spec claims
  visibility, not compliance. The change's live proof is the task-4.2
  end-to-end trial on this repository's own province: charter r48 recorded,
  flare r49 fired against vessel `skill`, the row decided declined with its
  evidence, the flare closed and proposed nothing further, outcome r50
  closed a kept charter — transcript with receipt ids and queue rows in the
  change's task report.

No data migration: logs and histories written before this change hold no
charter or flare markers, and every reader returns an empty answer — never
an error. Only the package version moves.

## 0.5.0 — 2026-09-06

The formats (openspec change `formats-pass`): Portolan's data model —
anchors, trust labels, receipts, staleness — becomes an interface a
consumer can adopt without this repository's source. Four JSON Schema
files are now the single source of four named, versioned format
contracts, and the Chart's machine layer leaves the server as one
self-describing document obtainable without the MCP server.

- **Four named, versioned formats** (draft 2020-12, each with a
  `version` field and a stable `$id`, all at `0.1.0`): the chart entry
  format (`chart.schema.json`), the trust vocabulary
  (`trust-vocabulary.schema.json` — the closed five-label enum, single
  source, `$ref`'d by the chart and export schemas), the ship's-log
  receipt format (`receipt.schema.json` — documents exactly what the
  log writes, so every historical line validates), and the adjacency
  graph export (`graph-export.schema.json`). The chart-entry and
  receipt schemas admit the store's metadata (`stale`, the vessels'
  `signature`) — additive schema facts, recorded in the `0.1.0`
  formats, not version bumps. Versioning policy and stability promise:
  semver from `0.1.0`, breaking=minor and additive=patch while 0.x;
  `1.0.0` stays the Governor's call.
- **`chart.export`, the fifteenth served tool** — the Chart's machine
  layer in one deterministic document: format `portolan-adjacency`,
  every non-fairway entry a node and every fairway an edge, each
  carrying its anchors, trust label, and staleness un-upgraded —
  `doubtful` and `unsurveyed` pass through; no timestamps, no invented
  nodes, no derived rollups. Byte-budgeted with loud truncation naming
  every cut vessel and its cut entry count; an absent Chart is a named
  error; staleness is refreshed before serving; exactly one ship's-log
  receipt per successful call, nothing else written.
- **`portolan export [--target <root>]`** — the same document on
  stdout through the CLI, over the same core function the tool calls,
  so MCP and CLI cannot diverge; non-zero exit on the honest errors,
  and no receipt on the CLI path.
- **`docs/formats.md` is the consumer contract** — purpose, schema
  path, current version, and stability promise per format, one ajv
  registration snippet, no core source reading required. The
  consumability claim is checked, not asserted:
  `scripts/consume-export.ts` obtains the export through the CLI and
  validates it against the schemas alone from an arbitrary working
  directory, and CI runs it on every change. Types are generated from
  the schemas (`scripts/gen-types.ts`, CI-failed drift guard) — schema
  wins, the hand mirror cannot drift.
- No data migration: `index.jsonl` and `log.jsonl` keep their shapes.
  The formats stay `0.1.0`; only the package version moves. The
  adoption bet itself remains judgment, not evidence — the schemas and
  the acceptance script prove consumability; further format spend
  waits for a real external consumer.

## 0.4.6 — 2026-09-06

Distribution follow-up: the MCP Registry listing rides the version-gated
publish job — after npm publishes, the same job logs into the registry
with GitHub OIDC (`mcp-publisher login github-oidc`) and publishes the
committed `server.json`. No OAuth app, no personal token, no manual
step: the listing is bound to this repository and updates on every
version-grown merge. First release of the package (`0.4.5`) was manual
per the runbook; trusted publishing and the registry path take over
from here. No product behavior changes.

## 0.4.5 — 2026-09-02

Distribution pass (openspec change `distribution-pass`, backlog candidate
C9): Portolan becomes installable from a registry and visible in the MCP
ecosystem — the first-run contract "survey \<target\> with Portolan" no
longer requires cloning this repo.

- **`@fcon-tech/portolan` on npm** — monopackage (core + skill +
  adapters) with one bin: `portolan serve|chartroom|harbor`. The
  preferred org `portolan` proved taken (registry probe, `measured`);
  the Governor-approved fallback applies. Launch lines use
  `bunx --package @fcon-tech/portolan portolan serve …` (the unscoped
  `portolan` name is a stranger's AGPL package).
- **`server.json` committed at repo root** — official MCP Registry
  manifest under `io.github.fcon-tech/portolan`, version-synced with the
  package version; CI (`manifest` job) validates it against the bundled
  official schema and fails on drift.
- **Version-gated publish** — `publish.yml` runs after green CI on
  version-grown merges via OIDC trusted publishing (no long-lived
  secrets); until the Governor's one-time setup (see
  `openspec/changes/distribution-pass/governor-runbook.md`) the job
  reports **blocked** and publishes nothing.
- **Registry-based install path** — the opencode installer writes the
  bunx launch line (no repo-root dependency) and copies the skill into
  `~/.config/opencode/skills/portolan-expedition/`; README quickstart
  leads with `bun install -g @fcon-tech/portolan`.
- Governor-blocked, honestly so: first manual release, npm trusted
  publisher config, registry listing (task 6.2) — `blocked`, not ready.
  License decided right after merge: MIT (`LICENSE` + `license` field).

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
