# Portolan Demo Runbook

Live demo for a newcomer: **install Portolan into the target** -> **build a
local atlas** -> **open the viewer** -> **use bundle-query for drill-down
navigation**.

This is the product demo path. Bigtop is the primary acceptance corpus; a
second arbitrary local repo or landscape proves the path is not Bigtop-specific.

## Setup

**Agent-installable path (copy to Cursor/OpenCode/Kimi/Codex/etc.):**

```text
PORTOLAN_PATH=<absolute Portolan checkout>
TARGET_ROOT=<absolute local repo or multi-repo root>
BUNDLE_DIR=<absolute empty output dir>

Use Portolan as an agent-installable landscape atlas layer for TARGET_ROOT.
Install the target-local wrappers first, build the atlas bundle into BUNDLE_DIR,
open the viewer when useful, and answer from bundle-query/source/drill-down
routes. Preserve unknown, cannot_verify, and not_assessed.
```

The first command installs only target-local instructions and wrappers:

```bash
"$PORTOLAN_PATH/scripts/portolan-install.sh" \
  "$TARGET_ROOT" \
  --harness all \
  --bundle-dir "$BUNDLE_DIR"
```

Then the agent should run the installed wrapper from the target:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" \
  "$TARGET_ROOT" \
  "$BUNDLE_DIR" \
  --yes --skip-install --no-viewer
```

For human-only runs where blocking in the viewer is fine, omit `--no-viewer`.
For locked-down corporate-style runs, keep `--skip-install`; missing producer
tools stay as gaps instead of installing anything without approval.

Open the viewer through the installed wrapper:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-viewer.sh" --bundle "$BUNDLE_DIR"
```

**Second-target reproducibility smoke (not Bigtop-specific):**

```bash
bash scripts/harness-reproducible-atlas-smoke.sh \
  /path/to/another/local/repo-or-landscape \
  /tmp/portolan-repro-atlas
```

This bounded smoke uses the same scanner path, keeps missing OSS tools as gaps,
and verifies atlas artifacts plus bundle-query.

**Single repo (portolan): useful for quick query eval, not sufficient as the
only reproducibility proof:**

```bash
export TARGET_ROOT=$(pwd)
export BUNDLE_DIR=/tmp/portolan-self

scripts/portolan-install.sh "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" \
  --no-viewer --yes --skip-install

# Optional Edges evidence graph:
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" \
  --yes --skip-install --no-viewer --with-map-bridge
```

Viewer on self bundle:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-viewer.sh" --bundle "$BUNDLE_DIR" --port 4173
```

Open http://127.0.0.1:4173/

**Bounded multi-repo (Bigtop quick sample):**

```bash
export TARGET_ROOT=~/projects/bigtop-landscape/repos
export BUNDLE_DIR=/tmp/portolan-bigtop

scripts/portolan-install.sh "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" \
  --yes --limit-repos 3 --producers semgrep,syft --no-viewer
```

**CTO multi-repo demo (full Bigtop corpus):**

```bash
export TARGET_ROOT=~/projects/bigtop-landscape/repos
export BUNDLE_DIR=/tmp/portolan-bigtop

scripts/portolan-install.sh "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" \
  --cross-repo-dup --yes --no-viewer --shard-timeout 600 --jscpd-memory-mb 2048
```

`--cross-repo-dup` runs **pairwise bounded** jscpd across every repo pair.
Completion is recorded in `producers/jscpd-cross/_scan.json`; proven zero
cross-repo clones after a complete scan is tier-A evidence (manifest
`cross_repo_duplication.status=complete`). `gap-cross-repo-dup` appears only
when one or more pairs fail, not as opt-in degradation.

Strict Bigtop corpus acceptance (not default CI):

```bash
scripts/harness-bigtop-acceptance.sh /tmp/portolan-bigtop
```

**Full landscape stress:**

```bash
export TARGET_ROOT=~/projects/bigtop-landscape/repos
export BUNDLE_DIR=/tmp/portolan-bigtop-full

scripts/portolan-install.sh "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" \
  --no-viewer --yes --shard-timeout 600 --jscpd-memory-mb 2048
```

Expect 30-90+ minutes. Failed shards appear in gaps, not as a scan abort.

## 6-Step Walkthrough

1. **Agent entrypoint** - Show the prompt above, the installed Cursor rule or
   managed `AGENTS.md` block, and the target-local `.portolan/bin` wrappers.
2. **Atlas overview** - Viewer answers what landscape was scanned, how many
   repos/components are visible, and what is missing.
3. **Map** - Select a component and show its dependency corridor, layer, source
   routes, and relationship records.
4. **Risks/findings** - Explain top pain points by kind/severity/repo. Do not
   mix agent claims into ranked tool findings.
5. **Drill-down** - Click finding/source route; open read-only source snippet.
6. **Agent handoff** - Run bundle-query for repos, relationships, hotspots,
   search/source, and show how the next agent continues from the same bundle.

## Agents Query At Answer Time

Portolan does not ship pre-built Q&A. Agents query the bundle:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" \
  hotspots --bundle "$BUNDLE_DIR" --kind duplication --limit 10
```

MCP is an optional bundle-query adapter for users who explicitly configure MCP:
`PORTOLAN_BUNDLE_DIR=<bundle> scripts/portolan-bundle-query-mcp.sh`. The recipe
is in `harness/recipes/bundle-query-mcp.md`.

If bundle output is truncated, use `hotspots-full.jsonl` through bundle-query;
the Risks tab shows the demo-ranked subset.

## Demo Bar

Use `/tmp/portolan-self` from a real self-target scan. Operator answers without
external docs:

| Question | Where in viewer |
| --- | --- |
| What is this target? | Atlas -> hero and executive brief |
| How is rank/pressure computed? | Atlas -> executive brief; Risks -> clusters |
| How do I navigate? | Atlas -> guided routes and cockpit |
| How many repos? | Atlas -> metrics; Sources -> component rows |
| Top problems? | Atlas -> inspection pressure; Risks -> clusters |
| Why is this finding pain? | Risks or inspector -> Evidence drill-down |
| What was not checked? | Edges -> visibility gaps; Agent loop -> bundle contract |
| Optional map-bridge relationships? | Edges -> evidence graph (only with `--with-map-bridge`) |

**Agent query eval (Lane B):** `scripts/run-query-eval.sh --self --run` after
self-scan.

Compare with `docs/test-corpora/apache-bigtop/examples/map-excerpt.md` for
section parity.

## CTO Scenario

Use `/tmp/portolan-bigtop` from the full corpus scan with `--cross-repo-dup`. The
concerned-CTO walkthrough states which tier the knowledge is:

| CTO question | Where | Tier |
| --- | --- | --- |
| What repos do I have and what does each do? | Sources -> component rows; Atlas -> selected component facts | A from manifests/README; purpose one-liner may be a labeled B claim |
| How are they connected? | Atlas -> relationship corridor; Edges -> selected edges | A (metadata-visible); not runtime topology |
| Do teams copy code between repos? | Risks -> cross-repo duplicates; Edges -> `cross-repo-duplication` when present | A (jscpd cross pass, opt-in) |
| Which repo is riskiest? | Atlas -> inspection pressure; Risks -> clusters; component drill-down top findings | A (tool findings only) |
| What does the agent think it means? | Agent loop -> Agent analysis claims; component inspector -> Agent claims | B/C/D - labeled, never mixed into ranked findings |
| What was not checked? | Edges -> visibility gaps; Agent loop -> rejected claims/import report | honesty layer |

Agent analysis pass, including a rejected negative case:

```bash
# agent writes claims per installed Portolan instructions and analysis-claims guardrails
"$TARGET_ROOT/.portolan/bin/portolan-import-analysis-claims.sh" \
  /tmp/portolan-bigtop \
  /tmp/bigtop-claims.jsonl
jq '.rejected' /tmp/portolan-bigtop/claims-import-report.json
```

**CTO query eval:** `scripts/run-query-eval.sh --run /tmp/portolan-bigtop`.
C1-C5 cover repos, relationships, cross-repo duplication, per-repo risk, and
claims.

## Talking Points

- Gaps/truncation = honest limits (`not_assessed`, budget cap).
- Every material claim ties to a bundle record, source path, or producer output.
- No network; local-first.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Empty viewer | Open it through `<target-root>/.portolan/bin/portolan-viewer.sh` after a successful scan |
| No source snippet | Hotspot has no paths, for example dep-hub; expected |
| Missing tools | Keep default gaps, or remove `--skip-install` only after operator approval |
