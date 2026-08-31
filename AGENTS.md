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
  Russian.

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

## OpenSpec workflow

Product behavior changes go through full cycles: nothing ships without one,
nothing stays unarchived.

1. `openspec new change <id>` — proposal, spec deltas, design, tasks under
   `openspec/changes/<id>/`.
2. `openspec validate --strict` before implementation; keep it passing.
3. Implement task by task; keep `bun test` green.
4. `openspec archive <id> --yes` when done. Living specs under
   `openspec/specs/` are the source of truth and must match served reality;
   repair drift on sight.

Every change ships through a merge request from a `change/<id>` branch —
never straight to `main`. Merge only on green CI. At merge time: bump
`@portolan/core` version and add the change's entry to `CHANGELOG.md`.

## Verification

Run before claiming anything is done:

```sh
bun test                            # repo root
bunx tsc --noEmit                   # in core/ and in acceptance/
openspec validate --specs --strict  # living specs
bun run skill/verify/checks.ts      # expedition skill
scripts/leak-gate.sh                # no machine paths in tracked files
```

<!-- portolan:harbor:begin -->
## Portolan province

This target is a charted Portolan province (Chart at `.portolan/chart/`, ship's log at `.portolan/log.jsonl`).

At session start, before other work: call the `expeditions.propose` tool from the `portolan` MCP server; if the queue is non-empty, present the top proposals in ONE chat message (kind, evidence summary, scope) and ask for a one-phrase decision; record it with `expeditions.decide`. Answer landscape questions from the Chart, citing anchors and trust labels. The full Cartographer's method: skill/SKILL.md. Never modify anything outside `.portolan/`.
<!-- portolan:harbor:end -->
