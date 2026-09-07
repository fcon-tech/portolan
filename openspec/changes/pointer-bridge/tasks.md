# pointer-bridge — tasks

Test-first discipline (AGENTS.md): tasks 1–4 carry spec deltas — their
failing acceptance tests are written from the deltas (test-writer) before
any implementation. Tasks 5–7 restate their verify lines as checks run red
before the work where applicable; a skipped test-first pass is recorded in
the task report.

## 1. Core pointer module

- [x] 1.1 New `core/src/pointer/` module: the template renderer (takes the
  skill name; the frontmatter derivation is an exported helper), the format
  name constant `portolan-pointer`, the format version constant `0.1.0`,
  the rendered block with begin/end markers and the version line, the
  placement function (replace between markers / append with orphan-marker
  cleanup, as a pure text transform), and the status parser over
  `<target>/AGENTS.md` returning exactly `current` / `stale (found,
  current)` / `missing` / `unparseable` — stale means the version is behind
  or the bytes diverge from the current render.
- [x] 1.2 Tests first (from the pointer delta): renderer bytes; version
  line carries the format version; installer-template and CLI-template
  byte-identity; parse of all four states; a version-preserving hand-edit
  parses stale; package-version independence of the rendered block.

## 2. `portolan pointer` CLI

- [x] 2.1 Dispatcher subcommand `pointer`: prints the rendered block to
  stdout, exit 0, no arguments (the block is target-independent), no
  ship's-log receipt (the `export` pattern).
- [x] 2.2 Tests: printed bytes equal the renderer bytes; no receipt appended
  on success; usage text lists the new subcommands.

## 3. `portolan install` CLI + installer on the core template

- [x] 3.1 Dispatcher subcommand `install` (spawn pattern of
  `chartroom`/`harbor`) routing to the opencode installer with the passed
  `--target`.
- [x] 3.2 `adapters/opencode/install.ts` imports the core template and
  calls the core placement function (delete its local block text and
  marker surgery); replace/append and orphan-marker cleanup semantics
  preserved byte-for-byte; output message names the Pointer.
- [x] 3.3 Update `core/src/server/adapters.test.ts` and
  `adapters/opencode/install.test.ts` to the shared template: idempotent
  reinstall over a hand-edited block; rest of file byte-identical.
- [x] 3.4 Ownership language: `scripts/hooks/harbor-markers.sh` reminder and
  `docs/workflow.md:7,12,79-83` — block owned by the core template, written
  at install and close-out, verified by the status line.

## 4. Status surfaces

- [x] 4.1 `trust.report`: one Pointer status line in the summary (tests
  first: four states; read-only — disk byte-identical; agreement with the
  parser).
- [x] 4.2 `expeditions.propose`: the same status in its output (tests
  first: four states; a stale Pointer adds no proposal).

## 5. Skill: the Pointer step and the block's mandates

- [ ] 5.1 Close-out Pointer step (verify version and bytes → silence, or
  rewrite + `log.append` receipt `pointer install` naming found/set
  versions and the file; repairs only an existing `AGENTS.md`, never
  creates the file); perimeter section names the Pointer exception; the
  one-approval wording covers it.
- [ ] 5.2 Block content (in the core template, verified here): session-start
  propose; one-message queue decision via `expeditions.decide`; chart-first
  Q&A with anchors and trust labels; `chart.neighborhood` before a
  multi-file/multi-vessel task; `.portolan/` boundary with the block's own
  refresh excepted; the skill by name; the bootstrap line naming the
  runnable bunx form (`bunx --package @fcon-tech/portolan portolan install
  --target .`).
- [ ] 5.3 Verify: `bun run skill/verify/checks.ts` green; a check for the
  close-out step added if the harness has one — otherwise record the skip
  in the task report.

## 6. Docs

- [ ] 6.1 `docs/formats.md`: the pointer section (purpose, markers, version
  line, defining artifact, version `0.1.0`, stability promise); the
  versioning section stops calling the adjacency export's version field
  "the only one".
- [ ] 6.2 `docs/MANIFEST.md`: glossary row **Pointer / Указатель**; the
  first-run contract mentions the Pointer; the tools table's
  `trust.report` row mentions the Pointer status line.

## 7. Dogfood

- [ ] 7.1 This repo's `AGENTS.md` block regenerated from the template
  (byte-identical to `portolan pointer` output); git diff touches nothing
  outside the markers.
- [ ] 7.2 Receipt for the placement deferred to the post-merge repair
  expedition (recorded in the task report — the cycle does not write the
  ship's log).

## 8. Whole-change verify

- [ ] 8.1 Full suite green: `bun test`; `bunx tsc --noEmit` in `core/` and
  `acceptance/`; `openspec validate --specs --strict`; `bun run
  skill/verify/checks.ts`; `scripts/leak-gate.sh`.
- [ ] 8.2 Socratic-advisor pass on the change; deferrals recorded in
  design.md.
- [ ] 8.3 Security-auditor pass on the whole diff (outside-perimeter write,
  install command, instruction-file bootstrap).
- [ ] 8.4 MR from `change/pointer-bridge`; merge on green CI; bump
  `@portolan/core`; CHANGELOG entry; post-merge repair expedition covers
  the `core` + `adapters` proposals and receipts the Pointer here.
