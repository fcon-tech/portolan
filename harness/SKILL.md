# Portolan Orient Harness

Use this skill when the user wants to find code pain (duplication, static smells,
dependency hubs) and navigate a local landscape with an orient map.

Portolan is a **harness supplement**: recipes + guardrails + orient bundle + local
viewer. The legacy Go CLI is optional (see `docs/harness/GO-FREEZE-POLICY.md`).

## Inputs

- `TARGET_PATH` — absolute path to repo or landscape root (read-only).
- `ORIENT_PATH` — absolute empty output directory for the orient bundle.
- `PORTOLAN_PATH` — absolute path to this Portolan checkout.

## Workflow (recommended: orient wizard)

One command checks tools, runs producers (with consent-gated install), builds the
bundle, prints a summary, and optionally opens the local viewer:

```bash
"$PORTOLAN_PATH/scripts/orient-wizard.sh" "$TARGET_PATH" "$ORIENT_PATH" --yes
```

Useful flags:

| Flag | Purpose |
| --- | --- |
| `--no-viewer` | Build bundle only |
| `--skip-install` | Never install missing tools (gaps only) |
| `--limit-repos N` | Cap multi-repo sharding |
| `--producers config,jscpd,semgrep,syft,ctags` | Subset of producers (default: all five) |
| `--shard-timeout SEC` | Per-repo producer timeout (default 600) |
| `--jscpd-memory-mb N` | Node heap cap per jscpd shard (default 2048) |
| `--hotspot-budget N` | Max hotspots in bundle; kind quotas apply when truncated |

Shard failures are recorded in `producers/_gaps.jsonl` and merged into `gaps.jsonl`.
Full hotspot list (pre-budget) is written to `hotspots-full.jsonl` for agents.
Producers respect `.gitignore` (jscpd `--gitignore`, ctags via `git ls-files`, config
scan via `git check-ignore`; bundle build drops any ignored paths that slip through).

### Manual fallback (recipes)

When you need fine-grained control, run individual recipes from `harness/recipes/`:

| User question | Recipe |
| --- | --- |
| Where is duplication? | `duplication-jscpd.md` |
| Where are smells / static issues? | `static-semgrep-local.md` |
| What depends on what? | `deps-syft-cyclonedx.md` |
| Config / deploy surfaces? | `config-surfaces.md` |
| Symbol-dense files (optional) | `symbols-ctags.md` |

Write outputs under `$ORIENT_PATH/producers/`, then:

```bash
"$PORTOLAN_PATH/scripts/build-orient-bundle.sh" "$TARGET_PATH" "$ORIENT_PATH"
```

### Open orient map (human)

```bash
cd "$PORTOLAN_PATH/viewer" && npm install && npm run serve -- --bundle "$ORIENT_PATH"
```

Viewer features (spec 090): search, kind/severity/repo filters, directory heat map,
truncation/gaps banners, and read-only source preview via `/source` (path-guarded).
Demo script: [`docs/demo-runbook.md`](../docs/demo-runbook.md).

### Agent navigation

Read in order:

1. `$ORIENT_PATH/manifest.json`
2. `$ORIENT_PATH/hotspots.jsonl` (ranked pain points)
3. `$ORIENT_PATH/gaps.jsonl` (missing evidence — do not invent)

Cite `hotspot.id` and `producer_ref` for every material claim.

Guardrails: `harness/guardrails/`.

## Legacy bridge (optional)

```bash
go run "$PORTOLAN_PATH/cmd/portolan" map --root "$TARGET_PATH" --out "$ORIENT_PATH/map" --force
"$PORTOLAN_PATH/scripts/orient-export-from-map.sh" "$ORIENT_PATH/map" "$ORIENT_PATH"
```

## User question routing

| Question | Start with | If missing |
| --- | --- | --- |
| Duplication? | hotspots `kind=duplication` | Run jscpd recipe; say `not_assessed` |
| Tech debt / smells? | hotspots `kind=static-finding` | Run Semgrep recipe |
| Config surfaces? | hotspots `kind=config` | Run config-surfaces recipe (no install) |
| Symbol-dense files? | hotspots `kind=debt-candidate` | Run ctags recipe or gap |
| Dependencies? | hotspots `kind=dep-hub` | Run Syft recipe |
| Where to start? | lowest `rank` in hotspots.jsonl | gaps.jsonl for next recipe |

## Do not

- Invent Portolan subcommands not listed here or in legacy Go `--help`.
- Promote `not_assessed` gaps to observed facts.
- Use LLM-generated graphs as evidence (viewer is presentation only).
