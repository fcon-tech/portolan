# Portolan Harness

Use this skill when the user wants to find code pain (duplication, static smells,
dependency hubs) and browse ranked hotspots in the local viewer.

Portolan is a **harness supplement**: recipes + guardrails + evidence bundle + local
viewer. The legacy Go CLI is optional (see `docs/harness/GO-FREEZE-POLICY.md`).

## Inputs

- `TARGET_PATH` — absolute path to repo or landscape root (read-only).
- `BUNDLE_DIR` — absolute empty output directory for the Portolan bundle (convention: any empty dir).
- `PORTOLAN_PATH` — absolute path to this Portolan checkout.

## Workflow (recommended: portolan scan)

One command checks tools, runs producers (with consent-gated install), builds the
bundle, prints a summary, and optionally opens the local viewer:

```bash
"$PORTOLAN_PATH/scripts/portolan-scan.sh" "$TARGET_PATH" "$BUNDLE_DIR" --yes
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

Write outputs under `$BUNDLE_DIR/producers/`, then:

```bash
"$PORTOLAN_PATH/scripts/build-portolan-bundle.sh" "$TARGET_PATH" "$BUNDLE_DIR"
```

### Open viewer (human)

```bash
cd "$PORTOLAN_PATH/viewer" && npm install && npm run serve -- --bundle "$BUNDLE_DIR"
```

Viewer features (spec 090): folder tree, ranked list, search, kind/severity/repo
filters, truncation/gaps banners, and read-only source preview via `/source`
(path-guarded).
Demo script: [`docs/demo-runbook.md`](../docs/demo-runbook.md).

### Agent navigation

Read in order:

1. `$BUNDLE_DIR/manifest.json`
2. `$BUNDLE_DIR/hotspots.jsonl` (ranked pain points)
3. `$BUNDLE_DIR/gaps.jsonl` (missing evidence — do not invent)

Cite `hotspot.id` and `producer_ref` for every material claim.

### Query the bundle (agent Q&A — no pre-built answers)

Portolan does **not** guess user questions. Query at answer time:

```bash
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --kind duplication --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "auth" --limit 30
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" symbol --bundle "$BUNDLE_DIR" --name "Run" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --path sample.go --line 4
```

Viewer HTTP (same contract): `GET /api/hotspots`, `/api/gaps`, `/api/search`, `/api/symbol`, `/api/source`.

Optional map-bridge (after `portolan map`):

```bash
"$PORTOLAN_PATH/scripts/build-map-bridge.sh" "$BUNDLE_DIR/map" "$BUNDLE_DIR"
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" evidence-index --bundle "$BUNDLE_DIR" --limit 20
```

Guardrails: `harness/guardrails/` including `bundle-query.md`.

### MCP (agent harnesses preferring tools over shell)

```bash
export PORTOLAN_BUNDLE_DIR="$BUNDLE_DIR"
"$PORTOLAN_PATH/scripts/portolan-bundle-query-mcp.sh"
```

Recipe: `harness/recipes/bundle-query-mcp.md` (Cursor `mcp.json` example). Tools mirror CLI families; results are `bundle-query-result` JSON.

## Legacy bridge (optional)

```bash
go run "$PORTOLAN_PATH/cmd/portolan" map --root "$TARGET_PATH" --out "$BUNDLE_DIR/map" --force
"$PORTOLAN_PATH/scripts/portolan-export-from-map.sh" "$BUNDLE_DIR/map" "$BUNDLE_DIR"
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
