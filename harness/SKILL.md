# Portolan Harness

Use this skill when the user wants an AI coding agent to build and use a local
software landscape atlas: visible repos/components, relationships, code pain,
configuration surfaces, gaps, drill-down source routes, and bounded query tools.

Portolan is an installable **harness supplement**: target-local wrappers,
recipes, guardrails, evidence bundle, and local atlas viewer. The legacy Go CLI
is optional (see `docs/harness/GO-FREEZE-POLICY.md`).

## Inputs

- `PORTOLAN` - Portolan git URL or absolute path to a local Portolan checkout.
- `TARGET_ROOT` - absolute path to repo or landscape root (read-only).
- `TARGET_PATH` - accepted alias for `TARGET_ROOT` in older prompts.
- `BUNDLE_DIR` - optional absolute output directory for the Portolan bundle.
  Default it to `<target-root>/.portolan/atlas` unless the operator supplied
  an explicit safe override.

Do not clone, fetch, install tools, start daemons, or mutate target source files
unless the operator explicitly approves it. Portolan writes installed harness
metadata under the target plus bundle artifacts under `BUNDLE_DIR`.

## Workflow

Install target-local wrappers first. Cursor, OpenCode, Codex, Kimi, Zed, and
other harnesses should then use `<target-root>/.portolan/bin` as the active
Portolan interface.

```bash
TARGET_ROOT="${TARGET_ROOT:-${TARGET_PATH:?set TARGET_ROOT}}"
PORTOLAN="${PORTOLAN:?set PORTOLAN to a git URL or local checkout path}"
BUNDLE_DIR="${BUNDLE_DIR:-$TARGET_ROOT/.portolan/atlas}"
if [[ "$PORTOLAN" == http://* || "$PORTOLAN" == https://* || "$PORTOLAN" == git@* ]]; then
  echo "Ask the operator before fetching exactly this Portolan URL: $PORTOLAN" >&2
  # After approval:
  PORTOLAN_CACHE="${PORTOLAN_CACHE:-$HOME/.cache/portolan-harness}"
  mkdir -p "$PORTOLAN_CACHE"
  PORTOLAN_PATH="$PORTOLAN_CACHE/portolan"
  if [[ -d "$PORTOLAN_PATH/.git" ]]; then
    git -C "$PORTOLAN_PATH" fetch --all --prune
    git -C "$PORTOLAN_PATH" pull --ff-only
  else
    git clone "$PORTOLAN" "$PORTOLAN_PATH"
  fi
else
  PORTOLAN_PATH="$PORTOLAN"
fi
"$PORTOLAN_PATH/scripts/portolan-install.sh" \
  "$TARGET_ROOT" \
  --harness all \
  --bundle-dir "$BUNDLE_DIR"
```

Build the atlas through the installed wrapper. Build first, then open the
viewer separately so the agent can continue querying the bundle:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" \
  --doctor \
  "$TARGET_ROOT" \
  "$BUNDLE_DIR" \
  --skip-install --no-viewer

"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" \
  --dry-run \
  "$TARGET_ROOT" \
  "$BUNDLE_DIR" \
  --skip-install --no-viewer

"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" \
  "$TARGET_ROOT" \
  "$BUNDLE_DIR" \
  --yes --skip-install --no-viewer
```

The doctor reports target shape, bundle writability, available/missing tools,
rough size, and local-first expectations without writing outputs. The dry-run
adds the planned reads, writes, tool commands, network expectations, and
approval-required actions. After a scan, read `$BUNDLE_DIR/receipt.json` before
handoff, then read `$BUNDLE_DIR/captain-atlas-scorecard.json`; together they
record command argv, target, bundle, producer states/gaps, local-first flags,
duration, viewer launch path, and which captain-atlas dimensions are verified
or not_assessed.

Use status before reusing a bundle and clean only when replacing generated
Portolan output:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "$TARGET_ROOT" "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --clean "$TARGET_ROOT" "$BUNDLE_DIR"
```

Useful flags:

| Flag | Purpose |
| --- | --- |
| `--doctor` | Read-only first-run check; no bundle writes |
| `--dry-run` / `--plan` | Read-only plan after doctor |
| `--status` | Read-only JSON status for reuse/freshness and handoff |
| `--clean` | Remove approved generated bundle output; refuses target/root/home/cwd |
| `--no-viewer` | Build bundle only; recommended for agent runs |
| `--skip-install` | Never install missing tools (gaps only) |
| `--limit-repos N` | Cap multi-repo sharding |
| `--producers config,jscpd,semgrep,syft,ctags` | Subset of producers (default: all five) |
| `--shard-timeout SEC` | Per-repo producer timeout (default 600) |
| `--jscpd-memory-mb N` | Node heap cap per jscpd shard (default 2048) |
| `--hotspot-budget N` | Max hotspots in bundle; kind quotas apply when truncated |
| `--with-map-bridge` | After bundle build, run the legacy map bridge sidecar (Edges evidence graph; failures become gaps) |

Remove `--skip-install` only after explicit operator approval to install missing
local OSS tools. Shard failures are recorded in `producers/_gaps.jsonl` and
merged into `gaps.jsonl`. Full hotspot list (pre-budget) is written to
`hotspots-full.jsonl` for agents. Producers respect `.gitignore` where the
underlying tool supports it.

### Manual fallback (recipes)

When you need fine-grained producer control, run individual recipes from
`harness/recipes/` and write outputs under `$BUNDLE_DIR/producers/`:

| User question | Recipe |
| --- | --- |
| Where is duplication? | `duplication-jscpd.md` |
| Where are smells / static issues? | `static-semgrep-local.md` |
| What depends on what? | `deps-syft-cyclonedx.md` |
| Config / deploy surfaces? | `config-surfaces.md` |
| Symbol-dense files (optional) | `symbols-ctags.md` |

Then rebuild the bundle from the local producer outputs:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
```

### Open atlas viewer (human)

```bash
"$TARGET_ROOT/.portolan/bin/portolan-viewer.sh" --bundle "$BUNDLE_DIR"
```

Viewer features: landscape overview, component map, relationship and source
drill-down, ranked hotspots, search, filters, gaps, agent handoff commands, and
read-only source preview via `/source` (path-guarded). Operator runbook:
`docs/demo-runbook.md`.

### Agent navigation

Read only the small control artifacts directly:

1. `$BUNDLE_DIR/receipt.json`
2. `$BUNDLE_DIR/captain-atlas-scorecard.json`
3. `$BUNDLE_DIR/captain-qna-eval.json` after running query eval
4. `$BUNDLE_DIR/captain-handoff.md` and `$BUNDLE_DIR/captain-handoff.json`

Do not load raw relationship, hotspot, gap, or source-content JSONL files into
chat on large estates. Query the bundle instead:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section components --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section edges --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
```

Cite `repo.id`, `relationship.id`, `hotspot.id`, `gap.id`, source paths, and
`producer_ref` for every material claim.

Generate the deterministic Q&A acceptance artifact when proving the atlas can
answer captain follow-ups without reading raw large outputs:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-query-eval.sh" --run "$BUNDLE_DIR"
```

This writes `$BUNDLE_DIR/captain-qna-eval.json` with five captain questions and
two selected-code questions answered from bounded `portolan-bundle-query`
results. Use it as evidence of queryability, not as a replacement for answering
the captain's actual question.

Build the final captain handoff after Q&A eval:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-captain-handoff.sh" "$BUNDLE_DIR"
```

This writes `$BUNDLE_DIR/captain-handoff.md` for the human summary and
`$BUNDLE_DIR/captain-handoff.json` for machine-readable status. Treat it as the
portable demo artifact for the completed atlas run.

### Query the bundle (agent Q&A)

Portolan does not guess user questions. Query at answer time through the
installed wrapper:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --kind duplication --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "auth" --limit 30
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" symbol --bundle "$BUNDLE_DIR" --name "Run" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo <repo-id> --path sample.go --line 4
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" claims --bundle "$BUNDLE_DIR" --tier analytical --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --type cross-repo-duplication --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --repo <repo-id> --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo <repo-id> --path README.md --full
```

Viewer HTTP (same contract): `GET /api/hotspots`, `/api/gaps`, `/api/search`,
`/api/symbol`, `/api/source`, `/api/claims`, `/api/repos`, `/api/relationships`.

### Selected code / active file workflow

When a user highlights a file, symbol, function, or subsystem in Cursor,
OpenCode, Codex, Kimi, Zed, Claude, or another coding-agent harness:

1. Resolve the selected path relative to one repo in `$BUNDLE_DIR/repos.json`.
2. Call `selected-code` first to get the bounded source, component, risk, gap,
   relationship, and atlas navigation packet:
   `"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "$BUNDLE_DIR" --repo <repo-id> --path <path> --line <line> --limit 20`.
3. Use `source`, `symbol`, `search`, `hotspots --repo <repo-id>`, and
   `relationships` as follow-up queries when the selected-code packet points to
   more detail or when repo/path/symbol resolution is ambiguous.
4. State whether runtime/config/vendor relationships are `runtime-visible`,
   `metadata-visible`, `source-visible`, `not_assessed`, `unknown`, or
   `cannot_verify`.

The selected-code result is a navigation aid. Do not claim a full call graph or
runtime topology unless the bundle has direct evidence for that surface.

### Agent analysis claims (tiers B/C/D)

LLM analysis may enter the bundle only as tier-labeled claims through the
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
   `{id, claim_tier, statement, subject, cited_refs[], agent}`. Subject:
   `landscape` | `repo:<id>` | `path:<rel>`. Ref formats: `hotspot:<id>`,
   `gap:<id>`, `relationship:<id>`, `repo:<id>`, `path:<rel>[:line]`,
   `producer_ref:<path>`.
3. Import through the installed wrapper:
   `"$TARGET_ROOT/.portolan/bin/portolan-import-analysis-claims.sh" "$BUNDLE_DIR" claims.jsonl`.
   Analytical/synthetic claims with zero or broken refs are rejected with a
   reason in `claims-import-report.json`; fix the refs or downgrade the tier.
4. Claims are bundle-snapshot-scoped: after a re-scan, re-run the import; refs
   that no longer resolve invalidate the claim (recorded in the report).

Guardrail: `harness/guardrails/analysis-claims.md`.

### Optional map bridge

Use this only when the user wants the legacy Edges evidence graph sidecar:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" \
  "$TARGET_ROOT" \
  "$BUNDLE_DIR" \
  --yes --skip-install --no-viewer --with-map-bridge
```

Or manually after a legacy map run:

```bash
go run "$PORTOLAN_PATH/cmd/portolan" map --root "$TARGET_ROOT" --out "$BUNDLE_DIR/map" --force
"$PORTOLAN_PATH/scripts/build-map-bridge.sh" "$BUNDLE_DIR/map" "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" evidence-index --bundle "$BUNDLE_DIR" --limit 20
```

Guardrails: `harness/guardrails/` including `bundle-query.md`.

### MCP (agent harnesses preferring tools over shell)

MCP is optional. Configure it only after a local bundle exists:

```bash
export PORTOLAN_BUNDLE_DIR="$BUNDLE_DIR"
"$PORTOLAN_PATH/scripts/portolan-bundle-query-mcp.sh"
```

Recipe: `harness/recipes/bundle-query-mcp.md` (Cursor `mcp.json` example).
Tools mirror CLI families; results are `bundle-query-result` JSON.

## Legacy bridge (optional)

Use only when the operator explicitly needs old map artifacts:

```bash
go run "$PORTOLAN_PATH/cmd/portolan" map --root "$TARGET_ROOT" --out "$BUNDLE_DIR/map" --force
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
