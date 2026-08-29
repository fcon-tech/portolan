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

**The Chart Room** — one self-contained HTML file per surveyed codebase. The
province as an archipelago: islands sized by code volume, dependency lanes
styled by trust, risks drawn with real chart symbols, entry points marked.
One toggle turns it into a layered dependency graph. Hover an island for its
atlas plate; click for the full dossier and impact set. No server, no install
— the file opens from anywhere.

**The Fleet Review** — several surveyed codebases assembled on one sheet,
each drawn from its own Chart, every group linking to its atlas.

**The Harbor** — a deterministic queue of what deserves an expedition next
(repairs, unexplored gaps, new land), a bounded night watch that launches
repairs through any external launcher on a schedule you own, and a one-command
manual launch for any single proposal. No daemon, ever.

**Honesty built in** — facts the surveys could not establish render as blank
water, never as decoration; sources that changed since the last survey wear a
*pending correction* hatch; the trust legend is always visible.

## The trust ladder

| Label | Means | On the map |
| --- | --- | --- |
| `measured` | read from source, anchored, sounded | deep water, solid lane |
| `charted` | declared by manifests, BOMs, packaging | mid band |
| `reported` | a claim from docs or reports | pale band |
| `doubtful` | asserted, then refuted or unverifiable | faint dashed lane |
| `unsurveyed` | not determined | blank water — no ink |

## Quickstart

```bash
# your agent installs Portolan itself from one phrase:
survey <target> with Portolan

# the atlas for a surveyed province (map + graph + dossier + ledger):
bun core/src/chartroom/cli.ts render --target /path/to/province

# several provinces on one sheet:
bun core/src/chartroom/cli.ts review --target /prov/a --target /prov/b

# the harbor, headless:
bun core/src/harbor/cli.ts propose --target <t> --format chat    # the queue
bun core/src/harbor/cli.ts run    --target <t> --fingerprint <fp> \
    --launcher adapters/opencode/expedition-launcher             # launch one
bun core/src/harbor/cli.ts watch  --target <t>  [same flags]     # night policy

# serve the twelve MCP tools to your harness:
bun core/src/server/main.ts --target /path/to/province
```

Requirements: [Bun](https://bun.sh), ripgrep, universal-ctags.

## What's inside

| Path | What lives there |
| --- | --- |
| `core/` | the Chart store, the twelve MCP tools (stdio server), the Harbor, the Chart Room renderer |
| `skill/` | the Cartographer's expedition method, as a harness-loadable skill |
| `adapters/` | opencode installer + expedition launcher, pi/omp shims, drop-in night-watch crontab |
| `acceptance/` | the sea-trial gate: the whole loop graded against a real corpus |
| `docs/` | the landing page, the product contract, demo screenshots |

## Documents

- Product contract — [docs/MANIFEST.md](docs/MANIFEST.md): locked glossary,
  postulates, non-goals.
- Landing page — [fcon-tech.github.io/portolan](https://fcon-tech.github.io/portolan/):
  screenshots, the live demo atlas, the trust ladder.
- Living specifications — `openspec/specs/` (validated); decision history —
  `openspec/changes/archive/`.
