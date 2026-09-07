# pointer-bridge — design

Decision record of the Governor's grilling session (2026-09-07) plus the
derived decisions made there explicit. Evidence anchors: backlog C10 row
(`~/work/research/portolan-backlog/backlog-proposal.md`), the design law
(Insight 3, anti-1 downgrades carried), the live rot
(`06a95e4` hand edit vs `357aa5d` installer text), installer
`adapters/opencode/install.ts:313-357`, dispatcher `core/src/bin/portolan.ts`.

## Decisions (Governor, 2026-09-07)

1. **Full change, not "already shipped".** The installer's block is C10's
   minimal form; the change promotes it (template ownership, version,
   lifecycle, verification).
2. **Audience: any visitor.** The block carries a bootstrap line naming the
   install command; the front door is not reserved for instrumented
   harnesses.
3. **Template lives in core.** One source; installer and CLI render from it;
   adapters stay thin (harness spec R4 respected — the template is not
   harness-specific).
4. **Writer split.** Core renders the bytes; the Cartographer places them at
   expedition close-out with its own file tools (harness approval, visible
   git diff) and receipts the act via `log.append`. The server never writes
   outside `.portolan/` — `trust.report` and `expeditions.propose` only
   read `AGENTS.md` — so the boundary the block itself teaches stays true
   for the software too.
5. **Fifth named format.** `portolan-pointer 0.1.0`; markers + a version
   line; status is a fact row, **not** a queue input (the harbor queue keeps
   exactly its four deterministic inputs; wrap-up self-heals each
   expedition, so a queue path would be YAGNI).
6. **Content additions only two:** the `chart.neighborhood` trigger (the
   invocation capability demands mandate + desk + adoption accounting; the
   block is the strongest in-repo instruction channel) and the bootstrap
   line. No charter mention — charter is expedition-time vocabulary the
   skill already owns. The block stays a mandate list; no prose overview
   (the corpse field: CodeSee, Sourcetrail, Structurizr Cloud).
7. **`AGENTS.md` only.** No CLAUDE.md mirrors, no symlinks (Q7).
8. **Term locked: Pointer / Указатель** (glossary row in MANIFEST).

## Derived decisions (made explicit, none silent)

- **Stale predicate = version line + bytes.** The motivating rot was a
  version-preserving hand-edit (`06a95e4`); comparing only the version line
  would call that exact incident `current` forever. The close-out step and
  the status parse compare the whole block against the current render; the
  false-positive cost is zero because regeneration is the fix and wrap-up
  self-heals every expedition.
- **Close-out repairs an existing `AGENTS.md` only.** A charted province
  with no file reports `missing` and is healed by install — the survey
  never creates a top-level file in the target.
- **Bootstrap command pinned to the runnable form:**
  `bunx --package @fcon-tech/portolan portolan install --target .` — a
  visitor has no `portolan` binary; the bunx launch line is the installer's
  own config form.
- **Boundary mandate carries its own exception.** The block's "modify
  nothing outside `.portolan/`" line ends with "this block's own refresh
  excepted" — otherwise the block forbids the very write the lifecycle
  performs (socratic finding, adopted as a content decision).
- **Version = format version, never package version.** Otherwise every
  release staled every province at once and `trust.report` would cry wolf
  fleet-wide. Same logic as the formats capability's versioning policy.
- **Skill name derived from frontmatter** (`skill/SKILL.md` `name:`) via an
  exported helper; the renderer takes the name as input, so neither the
  installer nor the CLI assumes a package-root path. The placement function
  (replace between markers / append with orphan-marker cleanup) is a pure
  text transform in the same core module — the installer calls it; the
  close-out step repeats its semantics by hand per the skill.
- **No JSON Schema for the pointer.** The document is prose mandates; a
  parsed-representation schema would validate two fields and adopt nobody.
  Documented as a text format (markers + version line) in `docs/formats.md`.
  Challenged at the socratic pass; stands.
- **Receipt shape unchanged.** The receipt format's `command` field is
  open; `pointer install` rides it with meta (found version, set version,
  file). No format bump.
- **Status surfaces: `trust.report` + `expeditions.propose`.** The block's
  consumer meets `expeditions.propose` at session start (the block's own
  first mandate), so the front door verifies itself at the moment of use;
  `trust.report` owns the verification summary. One parse function, two
  consumers. Night-watch report deliberately excluded — nothing consumes
  the Pointer at night.
- **`portolan install` routes, not reimplements.** Dispatcher spawns the
  adapter installer (the `chartroom`/`harbor` pattern). The bin is the
  composition root: core spawning the adapter there is wiring, not the
  core→adapters library dependency engineering.md §1 forbids (the rule
  governs library layering; the entry point composes, as the server wiring
  does). Today the route targets the opencode installer; the pi/omp launch
  shims stay shims.
- **Ownership language moves in three places** — `scripts/hooks/
  harbor-markers.sh` (the reminder text), `docs/workflow.md:7,12,79-83`,
  and the installer comments: the block is owned by the core template,
  written at install and close-out, verified by the status line.
- **Dogfood in-change:** this repo's own AGENTS.md block is regenerated
  from the template as a task, closing the live `06a95e4` vs `357aa5d`
  divergence. Its receipt lands with the post-merge repair expedition
  (chart + log belong to the expedition, not the cycle); the block's
  correctness here is proven by the byte-identical render test.
- **Honest limits carried into docs/reports:** the Pointer's effect on
  invocation is `unsurveyed` (no A/B; anti-1 stays one unreplicated
  study); receipts count installs, not mandate compliance — the C4
  phrasing, never stronger.

## Risks / security review surface

- Write outside `.portolan/` by the Cartographer (mandated, marker-scoped)
  and a new install command in an instruction file — security-auditor runs
  on the whole diff.
- Marker handling is already adversarially tested (orphan markers,
  misordering); the template module inherits those tests and keeps the
  installer's replace/cleanup semantics byte-for-byte.

## Deferrals (socratic pass, 2026-09-07 — verdict SIMPLIFY-FIRST)

- **`portolan install` routes only to the opencode installer.** pi/omp stay
  launch shims with no installer to route to; routing is a dispatcher
  switch, not a rewrite. Trigger: the first pi/omp adapter that ships its
  own installer.
- **Night-watch and watch reports carry no Pointer status.** The watch
  launches repair expeditions whose close-out self-heals the Pointer;
  nothing at night consumes the block. Trigger: the watch starts reporting
  session-start surfaces.
- **No adoption counter for the Pointer under the invocation capability.**
  Invocation scopes counters to chart-query tools; the Pointer is not one.
  Safe now: the adoption block stays `chart.neighborhood`-only. Trigger: a
  capability decision that the Pointer is an invocation-accounted surface.
- **Receipts count Pointer installs, not mandate compliance; the block's
  effect on invocation stays `unsurveyed`** (no A/B; anti-1 remains one
  unreplicated study). Trigger: the Governor commissions an adoption
  study.
- **The dogfood placement's receipt is deferred to the post-merge repair
  expedition** (task 7.2): the cycle does not write the ship's log; the
  block's correctness here is proven by the byte-identical render test.
  Trigger: the post-merge repair expedition itself.

Adopted instead of deferred (socratic findings 2, 3, 9): the stale
predicate compares bytes as well as the version; the "every line mandates"
scenario now matches the requirement's own SHALL NOT; the no-`AGENTS.md`
case is pinned to `missing` + install. Findings 1 (boundary exception) and
4 (bunx command) are adopted as derived decisions above.
