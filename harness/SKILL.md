# Portolan Harness

Use this skill when the user wants an AI coding agent to build and use a local
software landscape atlas: visible repos/components, relationships, code pain,
configuration surfaces, gaps, drill-down source routes, and bounded query tools.

Portolan is a **harness supplement**: recipes + guardrails + evidence bundle +
local atlas viewer. The legacy Go CLI is optional (see
`docs/harness/GO-FREEZE-POLICY.md`).

## Inputs

- `TARGET_ROOT` — absolute path to repo or landscape root (read-only).
- `TARGET_PATH` — accepted alias for `TARGET_ROOT` in older prompts.
- `BUNDLE_DIR` — absolute empty output directory for the Portolan bundle (convention: any empty dir).
- `PORTOLAN_PATH` — absolute path to this Portolan checkout.

## Workflow (recommended: portolan scan)

One command checks tools, runs producers (with consent-gated install), builds the
bundle, and prints a summary. Build first, then open the viewer separately so
the agent can continue querying the bundle:

```bash
"$PORTOLAN_PATH/scripts/portolan-scan.sh" "${TARGET_ROOT:-${TARGET_PATH:?set TARGET_ROOT}}" "$BUNDLE_DIR" --yes --skip-install --no-viewer
```

Useful flags:

| Flag | Purpose |
| --- | --- |
| `--no-viewer` | Build bundle only; recommended for agent runs |
| `--skip-install` | Never install missing tools (gaps only) |
| `--limit-repos N` | Cap multi-repo sharding |
| `--producers config,jscpd,semgrep,syft,ctags` | Subset of producers (default: all five) |
| `--shard-timeout SEC` | Per-repo producer timeout (default 600) |
| `--jscpd-memory-mb N` | Node heap cap per jscpd shard (default 2048) |
| `--hotspot-budget N` | Max hotspots in bundle; kind quotas apply when truncated |
| `--with-map-bridge` | After bundle build, run `portolan map` + `build-map-bridge.sh` (Edges evidence graph; failures → gap, scan still succeeds) |

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
"$PORTOLAN_PATH/scripts/build-portolan-bundle.sh" "${TARGET_ROOT:-${TARGET_PATH:?set TARGET_ROOT}}" "$BUNDLE_DIR"
```

### Open atlas viewer (human)

```bash
cd "$PORTOLAN_PATH/viewer"
node scripts/build-static.js
node scripts/serve.js --bundle "$BUNDLE_DIR"
```

Viewer features: Bigtop-grade landscape overview, component map, relationship
and source drill-down, ranked hotspots, search, filters, gaps, agent handoff
commands, and read-only source preview via `/source` (path-guarded).
Operator runbook: [`docs/demo-runbook.md`](../docs/demo-runbook.md).

### Agent navigation

Read in order:

1. `$BUNDLE_DIR/manifest.json`
2. `$BUNDLE_DIR/atlas-facts.json` (landscape components, relationships, surface routes)
3. `$BUNDLE_DIR/repo-profiles.json` (repo purpose, languages, config/CI/test surfaces)
4. `$BUNDLE_DIR/relationships.jsonl` (visible cross-repo relationships)
5. `$BUNDLE_DIR/hotspots.jsonl` and `$BUNDLE_DIR/hotspots-full.jsonl` (ranked pain points)
6. `$BUNDLE_DIR/gaps.jsonl` (missing evidence — do not invent)

Cite `repo.id`, `relationship.id`, `hotspot.id`, `gap.id`, source paths, and
`producer_ref` for every material claim.

### Query the bundle (agent Q&A — no pre-built answers)

Portolan does **not** guess user questions. Query at answer time:

```bash
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --kind duplication --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "auth" --limit 30
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" symbol --bundle "$BUNDLE_DIR" --name "Run" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo <repo-id> --path sample.go --line 4
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" claims --bundle "$BUNDLE_DIR" --tier analytical --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --type cross-repo-duplication --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --repo <repo-id> --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo <repo-id> --path README.md --full
```

Viewer HTTP (same contract): `GET /api/hotspots`, `/api/gaps`, `/api/search`, `/api/symbol`, `/api/source`, `/api/claims`, `/api/repos`, `/api/relationships`.

### Selected code / active file workflow

When a user highlights a file, symbol, function, or subsystem in Cursor,
OpenCode, Codex, Kimi, Zed, Claude, or another coding-agent harness:

1. Resolve the selected path relative to one repo in `$BUNDLE_DIR/repos.json`.
2. Call `source` for a bounded snippet.
3. Call `symbol` for the selected symbol when `symbol-index.jsonl` exists.
4. Call `search` for the selected path/name to find nearby indexed mentions.
5. Call `hotspots --repo <repo-id>` to show local pain around that repo.
6. Call `relationships` to show visible repo-to-repo or shared-dependency
   context.
7. State whether runtime/config/vendor relationships are `runtime-visible`,
   `metadata-visible`, `source-visible`, `not_assessed`, `unknown`, or
   `cannot_verify`.

The selected-code result is a navigation aid. Do not claim a full call graph or
runtime topology unless the bundle has direct evidence for that surface.

### Agent analysis claims (tiers B/C/D — spec 106)

LLM analysis may enter the bundle **only** as tier-labeled claims through the
importer. Tier A (tool evidence) is never authored by an agent.

| Tier | `claim_tier` | Meaning | Portolan verifies |
| --- | --- | --- | --- |
| B | `analytical` | aggregated from cited evidence | every cited ref resolves in bundle |
| C | `synthetic` | inference on top of cited evidence | refs resolve; the conclusion does not |
| D | `speculative` | hypothesis | labeling only |

Workflow:

1. Analyze the bundle through `bundle-query` families (hotspots, gaps,
   relationships, repos, search, source).
2. Write `claims.jsonl` lines per `harness/contracts/analysis-claims.schema.json`:
   `{id, claim_tier, statement, subject, cited_refs[], agent}`.
   Subject: `landscape` | `repo:<id>` | `path:<rel>`. Ref formats:
   `hotspot:<id>`, `gap:<id>`, `relationship:<id>`, `repo:<id>`,
   `path:<rel>[:line]`, `producer_ref:<path>`.
3. Import: `"$PORTOLAN_PATH/scripts/import-analysis-claims.sh" "$BUNDLE_DIR" claims.jsonl`.
   Analytical/synthetic claims with zero or broken refs are rejected with a
   reason in `claims-import-report.json` — fix the refs or downgrade the tier
   yourself; the importer never up- or downgrades.
4. Claims are bundle-snapshot-scoped: after a re-scan, re-run the import; refs
   that no longer resolve invalidate the claim (recorded in the report).

Guardrail: `harness/guardrails/analysis-claims.md`.

Optional map-bridge (Edges evidence graph — opt-in on scan):

```bash
"$PORTOLAN_PATH/scripts/portolan-scan.sh" "${TARGET_ROOT:-${TARGET_PATH:?set TARGET_ROOT}}" "$BUNDLE_DIR" --yes --skip-install --no-viewer --with-map-bridge
```

Or manually after `portolan map`:

```bash
go run "$PORTOLAN_PATH/cmd/portolan" map --root "${TARGET_ROOT:-${TARGET_PATH:?set TARGET_ROOT}}" --out "$BUNDLE_DIR/map" --force
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
go run "$PORTOLAN_PATH/cmd/portolan" map --root "${TARGET_ROOT:-${TARGET_PATH:?set TARGET_ROOT}}" --out "$BUNDLE_DIR/map" --force
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
