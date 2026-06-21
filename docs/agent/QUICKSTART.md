# Agent Quickstart

Use this when a user asks you to map, inspect, audit, or explain a local target
with Portolan.

If the user asks another agent to "install Portolan", use the copyable prompt
in `docs/agent/INSTALL-PROMPT.md` or `docs/agent/INSTALL-PROMPT.ru.md`.

For Cursor, OpenCode, install/build, and human-facing documentation routing,
read `docs/onboarding.md` before broad claims about harness support. Cursor UI
behavior is not proven by headless Cursor Agent CLI evidence. OpenCode should
use a bundle path inside the target unless the permission mode explicitly
allows another output root.

For generated reports, use `docs/product-quality-boundary.md`,
`docs/product-maturity.md`, and `docs/report-quality.md` before treating a
report as product-ready.

## Inputs You Need

- Portolan checkout.
- Local target root to inspect.
- Bundle output directory for Portolan artifacts.

Do not use network, credentials, cloning, or target mutation unless the user
explicitly approves it.

## 1. Prefer The Harness Atlas Path

For current product use, start with the harness-first atlas path. It does not require
the legacy Go CLI as the primary entrypoint:

```bash
"$PORTOLAN_PATH/scripts/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
```

Use these modifiers deliberately:

- remove `--skip-install` only after explicit operator approval to install
  missing OSS tools.
- `--limit-repos N` for a bounded first pass on very large landscapes.
- `--with-map-bridge` when you want legacy `portolan map` evidence-index hints.

After the scan, read the atlas artifacts before answering:

- `manifest.json`
- `atlas-facts.json`
- `repo-profiles.json`
- `relationships.jsonl`
- `hotspots.jsonl`
- `hotspots-full.jsonl`
- `gaps.jsonl`
- `atlas-surface-content.json`

Open the viewer when the user needs a human-readable atlas:

```bash
cd "$PORTOLAN_PATH/viewer"
node scripts/build-static.js
node scripts/serve.js --bundle "$BUNDLE_DIR"
```

Query the same bundle at answer time:

```bash
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "auth" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo <repo-id> --path README.md --line 1
```

## 2. Route Selected Code Back To The Atlas

When the user highlights a file, symbol, or subsystem in a coding-agent UI:

1. Identify the selected path and repo root.
2. Query `source` for a bounded snippet.
3. Query `search` or `symbol` for related names when indexes exist.
4. Query `hotspots --repo <repo-id>` for local pain around the repo.
5. Query `relationships` to explain visible connections to other repos.
6. Query `gaps` for unknown, cannot_verify, or not_assessed surfaces.
7. Answer with explicit gaps when runtime/config/vendor relationships are not
   present in the bundle.

Do not infer runtime calls from static dependency or source-search results.

## 3. Legacy Go Path When Needed

Use the legacy Go path only when the user explicitly asks for
`context prepare`, `map`, or older map artifacts.

Prefer an installed binary:

```bash
portolan --version
```

From a Portolan source checkout, build the repo-local binary:

```bash
cd <portolan-checkout>
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

```bash
portolan context prepare --root <target-root> --out <output-dir>/context --profile agent
```

If using the repo-local binary:

```bash
.portolan/bin/portolan context prepare --root <target-root> --out <output-dir>/context --profile agent
```

Read these files before answering broad questions:

- `agent-brief.md`
- `answer-contract.md`
- `query-plan.md`
- `evidence-index.jsonl`
- `repos.json`
- `tool-registry.json`
- `oss-plan.json`
- `gaps.jsonl`

## 4. Create A Legacy Map When Needed

```bash
portolan map --root <target-root> --out <output-dir>/map
```

If the target provides a local `selection.json`, validate it and use it for the
map instead of inventing a new selection:

```bash
portolan selection validate --selection <target-root>/selection.json
portolan map --selection <target-root>/selection.json --out <output-dir>/map
```

If selection validation fails, record the validation command as `failed`, then
fall back to `map --root <target-root>` unless the user asked you to stop on
invalid selections.

Read these files before reporting map-backed claims:

- `run.json`
- `coverage.json`
- `summary.json`
- `graph-index.json`
- `findings.jsonl`
- `map.md`

Before opening `graph.json`, ask bounded read-only questions against the map
bundle:

```bash
portolan query findings --bundle <output-dir>/map --kind relationships --limit 20
portolan query gaps --bundle <output-dir>/map --limit 20
```

Use `query findings` when you need matching records by kind, for example
`relationships`, `duplication`, `configuration`, or `technical-debt`. Use
`query gaps` when you need to explain `unknown`, `cannot_verify`, or
`not_assessed` evidence before answering. `claim-only` records remain available
through `query findings` by kind. Query output includes stable `portolan://`
references for citation.

Open `graph.json` only when the bounded files, query output, and graph slices
are insufficient.

## 5. Answer From Evidence

Your report should include:

1. Run status and blockers
2. Visible repositories or scope
3. Relationships
4. Duplication
5. Configuration surfaces
6. Technical-debt candidates
7. Unknown and `cannot_verify`
8. Not assessed

Do not invent facts that are not in the Portolan artifacts.

## 6. Preserve Boundaries

- Source/config duplicate clusters are evidence, not a refactoring order.
- Local visible scope is not complete estate coverage.
- Runtime topology needs runtime observations.
- OSS tools are valid local dependencies when installed and explicitly
  requested, but output recipes are not evidence until outputs exist.
- `not_assessed` is a valid result.
