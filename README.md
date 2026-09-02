# Portolan

[![CI](https://github.com/fcon-tech/portolan/actions/workflows/ci.yml/badge.svg)](https://github.com/fcon-tech/portolan/actions/workflows/ci.yml)

A frontier agent — the **Cartographer** — surveys a brownfield codebase into a
living nautical **Chart**: every component, dependency, entry point, config
surface, API contract and risk, each fact anchored to source and stamped with a
trust label. A human — the **Governor** — reads it as an atlas and always knows
what is measured, what is only declared, and what is uncharted water.

```
survey <target> with Portolan   ← the whole first-run UX
```

## What you get

**The Chart Room**: one self-contained HTML file per surveyed codebase. The
province as an archipelago: islands sized by code volume, dependency lanes
styled by trust, risks drawn with real chart symbols, entry points marked.
One toggle turns it into a layered dependency graph. Hover an island for its
atlas plate; click for the full dossier and impact set. No server, no
install: the file opens from anywhere.

**The Fleet Review**: several surveyed codebases assembled on one page,
each drawn from its own Chart, every group linking to its atlas.

**The Harbor**: a deterministic queue of what deserves an expedition next
(repairs, unexplored gaps, new land), a bounded night watch that launches
repairs through any external launcher on a schedule you own, and a one-command
manual launch for any single proposal. No daemon, ever.

**Honesty built in**: facts the surveys could not establish render as blank
water, never as decoration; sources that changed since the last survey wear a
*pending correction* hatch; the trust legend is always visible.

**Verification as the product spine**: one call — `trust.report` — lays the
province's verification state on the table: the trust-label distribution,
what drifted into *pending correction*, the ship's-log tail, and a fresh
deterministic re-sounding of every anchor on the Chart, any refuted one named
instead of smoothed over. Portolan charts itself: [its own
receipt](docs/demo/trust-report.md) holds 46 entries, 45 of them `measured`,
all 99 anchors re-sounded `confirmed`. No surveyed tool markets this
combination of anchors, closed trust labels, receipts, and staleness
([verification-property trials, 2026-08-31](docs/verification-trials.md)).

## The trust ladder

| Label | Means | On the map |
| --- | --- | --- |
| `measured` | read from source, anchored, sounded | deep water, solid lane |
| `charted` | declared by manifests, BOMs, packaging | mid band |
| `reported` | a claim from docs or reports | pale band |
| `doubtful` | evidence present, could not be validated | faint dashed lane |
| `unsurveyed` | not determined | blank water — no ink |

## Quickstart

Install once from npm — no clone of this repository:

```bash
bun install -g @fcon-tech/portolan    # or: npm i -g @fcon-tech/portolan
```

```bash
# your agent installs Portolan itself from one phrase:
survey <target> with Portolan

# serve the fourteen MCP tools to your harness:
portolan serve --target /path/to/province

# the atlas for a surveyed province (map + graph + dossier + ledger):
portolan chartroom render --target /path/to/province

# several provinces on one page:
portolan chartroom review --target /prov/a --target /prov/b

# the harbor, headless:
portolan harbor propose --target <t> --format chat    # the queue
portolan harbor run    --target <t> --fingerprint <fp> \
    --launcher adapters/opencode/expedition-launcher  # launch one
portolan harbor watch  --target <t>  [same flags]     # night policy
```

Requirements: [Bun](https://bun.sh), ripgrep, universal-ctags — external by
design: Portolan wraps them and never bundles them.

Contributors, from a checkout of this repository:

```bash
bun core/src/server/main.ts --target /path/to/province    # dev path
```

## What's inside

| Path | What lives there |
| --- | --- |
| `core/` | the Chart store, the fourteen MCP tools (stdio server), the Harbor, the Chart Room renderer |
| `skill/` | the Cartographer's expedition method, as a harness-loadable skill |
| `adapters/` | opencode installer + expedition launcher, pi/omp shims, drop-in night-watch crontab |
| `acceptance/` | the sea-trial gate: the whole loop graded against a real corpus |
| `docs/` | the landing page, the product contract, demo screenshots |

## Documents

- Product contract — [docs/MANIFEST.md](docs/MANIFEST.md): locked glossary,
  postulates, non-goals.
- Landing page — [fcon-tech.github.io/portolan](https://fcon-tech.github.io/portolan/):
  screenshots, the live demo atlas, the trust ladder.
- Living specifications live in `openspec/specs/` (validated); decision
  history in `openspec/changes/archive/`.
