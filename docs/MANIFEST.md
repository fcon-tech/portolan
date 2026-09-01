# Portolan v3 — Manifest

Date locked: 2026-08-23. This document is the product contract for Portolan
v3. It supersedes everything in v2 (preserved on the `v2-archive` branch of
this repository; take ideas, not code).

## The product, one phrase

The Governor tells a Cartographer agent "survey my province" — the agent runs
an Expedition, takes soundings, keeps the ship's log, plots vessels, fairways,
ports of entry, lights and dangers onto the Chart, honestly leaves unsurveyed
waters unsurveyed — and lays the Sailing Directions on the Governor's desk.
The Chart (the Padrón) lives in the province; every later expedition corrects
it instead of redrawing it.

Concretely: a frontier-model agent (pi / omp / opencode) builds and maintains
a living tech-design map of a brownfield codebase, stored **inside the
target**, so a human can understand **how and why the codebase works** —
component behavior, connections, C4 views, API contracts, and where it smells.

## Why v2 died (lessons, kept short)

- The deterministic pipeline never actually recovered the code map — it
  produced fragments. Hand-written parsers for twenty languages is a losing
  game when a frontier model with good tools reads unfamiliar code better.
- 51k lines, 12 specs, BDD ceremony — and the core promise unmet. Evidence
  machinery became the product; the map never was.
- Build-for-specs and build-for-market-gaps both lose to build-for-pain.

## Postulates v3

Kept from v2:

1. **One phrase / one command first-run.** The Governor asks in one sentence;
   the agent does everything else. Zero copied commands.
2. **Trust vocabulary** (now the chart-notation vocabulary, below). The map
   never turns missing evidence into confidence.
3. **Bigtop as the acceptance corpus.** Mature, well-documented, smells of age.

Dropped from v2 (each decision 2026-08-23):

- Human-atlas-as-product → the atlas/HTML is at most a byproduct.
- One-shot snapshot → the Chart is living and incremental.
- Local-first/no-network dogma → permissions are explicit and approvable.
- Three truths as a systematic product → never rebuild this.
- Cursor-first acceptance → targets are pi / omp / opencode (opencode is the
  corporate candidate).
- Clean Architecture / TDD / BDD-chain ceremony → engineering process is
  lightweight; correctness is proven by the sea trial, not by ritual.

## The Chart

Location: `<target>/.portolan/chart/`.

- **Sheets** — one markdown dossier per vessel (deployable unit): behavior,
  fairways in/out, ports of entry, lights (API surfaces), beacons (config:
  env, flags, ports), dangers (smells/risks with anchors), unsurveyed list.
- **`index.jsonl`** — the machine layer: vessels, typed fairways (edges),
  anchors, trust labels, staleness. Written atomically with the sheets.
- **C4 views** — Cartographer-authored, inside sheets; every node/edge must
  carry anchors that `sound.*` can verify. Diagrams (Mermaid/PlantUML) are
  exports, never the storage. *Deferred: v1 ships no C4 entry kind or sheet
  section — a follow-up change adds it; do not claim C4 coverage until it
  lands.*
- **Living corrections** — per-unit tree signatures mark entries
  `pending correction` after source changes; each expedition repairs the
  Padrón. Changes are reported as **Notices to Mariners**.

Minimum chart content (the "it works" bar):

1. Deployable units (vessels).
2. Typed inter-unit dependencies with anchors (fairways) — an optional
   `relation` enum `build | runtime | config`, recorded when evidence
   shows it; untyped fairways stay valid.
3. Entry points and config surfaces (ports of entry, beacons).
4. C4 views (agent-authored, verifiable).
5. API contracts as surfaces (lights): endpoints, exported symbols, CLI
   flags, events.
6. Smells/dangers: model-judged with anchors; jscpd/semgrep corroborate
   where cheap (SARIF normalized).
7. Honest unsurveyed waters.

## Trust vocabulary (chart notation)

Real nautical charts grade their data; we adopt it wholesale:

| Label | Meaning | Russian |
| --- | --- | --- |
| `measured` | taken from source directly | промер |
| `charted` | from manifests/metadata | по описи |
| `reported` | from docs/commits/tickets — claims, not facts | по донесению |
| `doubtful` | evidence present, could not be validated | сомнительно |
| `unsurveyed` | no usable evidence; never faked | непромерено |

Every chart entry carries a trust label and anchors. `chart.write` rejects
entries without them.

## The Cartographer and the tools

The model is the cartographer; determinism serves it. The fourteen served
MCP tools (core):

| Tool | Purpose |
| --- | --- |
| `chart.read` / `chart.write` | Chart CRUD; schema-validated; requires anchors + trust labels, else rejects |
| `chart.render` | the Chart Room: the one-file visual export of the province |
| `trust.report` | the verification summary: trust-label distribution, staleness after a refresh, every anchor re-sounded deterministically with refuted ones named, ship's-log tail |
| `chart.neighborhood` | the neighborhood query over the Chart's fairways: direction/depth traversal, fan-in-ranked, budgeted, on-demand verify re-sounding, read-only (one ship's-log receipt per call) |
| `sweep` | ripgrep-backed search returning anchored chunks |
| `symbols` | ctags-backed definitions and references |
| `manifests` | cheap deterministic facts from go.mod / pom / package.json / Cargo / pubspec… |
| `sound.edge` / `sound.anchor` | deterministic verification that an asserted edge/anchor exists |
| `log.append` / `log.read` | the ship's log: a receipt for every command run |
| `expeditions.propose` / `expeditions.decide` | the harbor: the deterministic expedition queue, and the record of the Governor's decisions |

Still ahead: `smells.scan` (jscpd/semgrep wrappers, SARIF in) and MCP
`run` (target builds/tests, with approval). The `run` that exists today is
a harbor CLI command — it launches one proposal through an external
launcher; it is not an MCP tool.

Intent sources (the "why"): git history, ADRs, READMEs, docs — included but
always `reported`. Jira/Confluence optional adapters, never required.

## Permissions

- Network and tool installation: one explicit approval per session.
- Running target builds/tests: yes — often the only way to know brownfield.
- Cache/Chart writes: only under `<target>/.portolan/`.
- Source mutation: never. Portolan is a reader, not a surgeon.

## First-run contract

The Governor writes one phrase ("survey <target> with Portolan") → the agent
installs the skill + MCP into its harness, asks the one approval, runs the
expedition, and returns **Sailing Directions**: the top findings (structure,
risks, smells) with anchors and where the Chart lives. Afterwards: continuous
Q&A; the Chart survives sessions.

## Sea trial (acceptance)

Corpus: **Apache Bigtop**, directly — no intermediate fixture.

Gate (all three):

1. **Calibration questions** (see `acceptance/bigtop-sea-trial.md`): 10–15
   questions with known answers; the chart + agent must answer correctly,
   anchored. A fabricated anchor is an automatic fail.
2. **Machine metrics**: fairway completeness against the BOM/manifests; share
   of `measured/charted` vs `reported`; correct `pending correction` after a
   file change.
3. **Governor's read**: the Governor reads the sheets and confirms this is
   the real Bigtop, not a hallucination.

## Stack, repo, harnesses

- **TypeScript on Bun**, one language for core, tools, adapters.
- Repo: this one (`portolan`; product name stays **Portolan**). Old repo
  archived at `origin/v2-archive`, local copy deleted 2026-08-30.
- Harness targets: opencode first (corporate candidate), pi/omp by
  portability. Zero harness-specific code in the core; harness adapters are
  thin shims (`adapters/`).
- Wrap, don't build: ripgrep, ctags, semgrep (LGPL engine; own/free rules
  only), jscpd, SARIF. Never vendor: Repowise (AGPL-3.0 — clean-room only),
  golangci-lint (GPL-3.0 — external process only).

```
portolan/
  core/            # MCP server + deterministic utilities (TS/Bun)
    src/tools/     # chart.*, sweep, symbols, manifests, sound.*, log.*
    src/server/    # the stdio server, the tool registry, the wiring
    src/harbor/    # the expedition queue: propose, watch, run
    src/chartroom/ # the Chart Room renderer (room + fleet review)
    schema/        # chart ontology + trust vocabulary (JSON Schema)
  skill/           # the cartographer's method (skill for pi/omp/opencode)
  acceptance/      # Bigtop sea trial: calibration questions + gate runner
  adapters/        # opencode plugin first, pi/omp shims
  docs/            # this manifest, the landing page, demo artifacts
```

## Non-goals (explicit)

- No openspec-delta generation; spec↔code verification is OpenSpec's job. At
  most, bluntly highlight an obvious divergence.
- No systematic triangulation (three truths) — ever.
- No HTML atlas as a core deliverable; no hand-written per-language parsers;
  no BDD/CA ceremony; no build-for-market-gap theses.

## Glossary (locked 2026-08-23)

| Role/concept | Term | Russian |
| --- | --- | --- |
| Human who outfits expeditions | Governor | Губернатор |
| Agent that surveys | Cartographer | Картограф |
| One mapping run | Expedition | Экспедиция |
| The living map | The Chart (Padrón) | Карта (Падрон) |
| Component dossier | Chart sheet | Лист карты |
| Deployable unit | Vessel | Судно |
| Dependency edge | Fairway | Фарватер |
| Entry point | Port of entry | Порт захода |
| Config surface | Beacon | Знак |
| API contract | Light | Огонь |
| Smell / risk | Danger (rock / shallow / wreck) | Опасность |
| Unknown | Unsurveyed | Непромерённые воды |
| Staleness | Pending correction | Требует исправления |
| Change report | Notices to Mariners | Извещение мореплавателям |
| Governor's brief | Sailing Directions | Лоция |
| Acceptance run | Sea trial | Ходовые испытания |
| One-file map/graph export of the Chart | Chart room | Штурманская |
| Assembled view of several provinces | Fleet review | Смотр флота |
| One-call verification summary | Trust report | Верификационная сводка |
