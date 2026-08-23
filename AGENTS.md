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
- No openspec-delta generation, no systematic triangulation, no HTML atlas
  as a deliverable, no BDD/CA ceremony. Non-goals are non-goals.
- Every claim in a chart/doc carries an anchor and a trust label or it does
  not ship.
- The old repo at `../portolan` is frozen reference: read for ideas, copy no
  code.
- Commit after each coherent unit of work.
