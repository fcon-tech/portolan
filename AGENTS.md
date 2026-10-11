# Agent Instructions

Read [docs/MANIFEST.md](docs/MANIFEST.md) first — it is the product contract
and supersedes habits from v2.

Key rules:

- Terminology is locked there (Governor, Cartographer, Expedition, Chart,
  vessels, fairways, trust vocabulary). Do not introduce synonyms; never
  "captain"/"admiral".
- The model is the cartographer; determinism only serves verification
  (soundings, receipts). Do not build hand-written per-language parsers.
- TypeScript on Bun only. Wrap ripgrep/ctags/semgrep/jscpd; never vendor
  Repowise (AGPL) or golangci-lint (GPL).
- Product non-goals (docs/MANIFEST.md) are non-goals: no openspec-delta
  generation as a product feature, no systematic triangulation, no HTML
  atlas as a deliverable, no BDD/CA ceremony. (This repo develops itself
  through OpenSpec cycles — see below; do not confuse the two.)
- Every claim in a chart/doc carries an anchor and a trust label or it does
  not ship.
- The old v2 repo is frozen reference, preserved on the `v2-archive` branch
  of this repository: read for ideas, copy no code.
- Code, artifacts, and commit messages in English; reply to the Governor in
  Russian — plain, human Russian (Ilyakhov's infostyle): no anglicisms or
  jargon where a common Russian word exists, no bureaucratese, short
  concrete sentences. Locked nautical terms and tool/format identifiers
  stay as they are.

## Working principles

- Never author an artifact from memory: read the actual sources fully first
  — specs, code, and docs alike.
- No self-certification: present work against pre-agreed criteria with
  evidence labels (verified / not_assessed / assumed / blocked / failed);
  the Governor delivers the verdict. Never call a surface ready unless its
  scenario is proven.
- Charts render truth only: embedded bytes and arithmetic over them. What
  is not in the Chart is not drawn.
- Small changes, conventional commits, a commit per coherent unit without
  waiting to be asked. Do not hide failed or not-assessed checks.
- The repo is public: no machine home paths in tracked files —
  `scripts/leak-gate.sh` (Verification) must stay clean.
- Engineering practices — architecture, code style, the YAGNI/KISS/DRY
  ladder — are fixed in [docs/engineering.md](docs/engineering.md); they
  serve the contract above and never override it.

## OpenSpec workflow

Product behavior changes and large fixes go through full OpenSpec cycles: explore → propose →
apply → verify → archive — openspec's own agent commands under
`.zcode/commands/opsx/`; use `/opsx:*` where the harness serves them,
otherwise run the same stages by hand. A behavior change does not ship without
a cycle, and its cycle does not stay unarchived. Documentation, process,
mechanical edits, and small repairs of already specified behavior use the
existing task or ticket, an ordinary working branch and pull request; they do not require an OpenSpec change, a
`change/<id>` branch, a release-version bump, or a changelog entry. Their CI
still runs. The rules for behavior changes:

- Every change ships through a merge request from a `change/<id>` branch —
  never straight to `main`; merge only on green CI.
- At merge time for a behavior change: bump the `@portolan/core` version and
  add the change's entry to `CHANGELOG.md`.
- Verification is written before the work, and a skipped test-first pass is
  a recorded decision in the task report, not a default.

The assembled protocol — the unified session briefing, the routing between
cycle and expeditions, the joints — is fixed in
[docs/workflow.md](docs/workflow.md); it owns the procedure.

## Verification

For a product-behavior cycle, run before claiming it done:

```sh
bun test                            # repo root
bunx tsc --noEmit                   # in core/ and in acceptance/
openspec validate --specs --strict  # living specs
bun run skill/verify/checks.ts      # expedition skill
scripts/leak-gate.sh                # no machine paths in tracked files
```

For documentation, process, mechanical edits, and small repairs of already
specified behavior, inspect the final diff, run the smallest check that exercises the changed contract and the leak
gate, then rely on the pull-request CI for the repository gate. Report exactly
which checks ran and any material gap.

<!-- portolan:harbor:begin -->
## Portolan province (Chart at `.portolan/chart/`, ship's log at `.portolan/log.jsonl`)

At session start, before other work: call the `expeditions.propose` tool from the `portolan` MCP server; if the queue is non-empty, present the top proposals in ONE chat message (kind, evidence summary, scope) and ask for a one-phrase decision; record it with `expeditions.decide`. Answer landscape questions from the Chart, citing anchors and trust labels. Call `chart.neighborhood` before a task touching more than one file or vessel. Never modify anything outside `.portolan/`, this block's own refresh excepted. The full Cartographer's method: the `portolan-expedition` skill (your harness loads it from its skills directory).

No `portolan` tools in this harness yet? One command installs the server, the skill, and this block: `bunx --package @fcon-tech/portolan portolan install --target .`

portolan-pointer 0.1.0
<!-- portolan:harbor:end -->

## Repository scope of the generated harbor pointer

The Portolan core template owns the generated block above. In this repository,
this task scope overrides its unconditional session-start wording: run the
harbor briefing only for Portolan planning or an expedition; surface a queue
decision only when it materially affects the requested work. The `.portolan/`
write boundary applies to Cartographer chart maintenance. Explicitly requested
source changes follow the development workflow above.
