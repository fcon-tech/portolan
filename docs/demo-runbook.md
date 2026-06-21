# Portolan Demo Runbook

Live demo for a newcomer: **agent installs Portolan into its workflow** →
**builds a local atlas** → **opens the viewer** → **uses bundle-query for
drill-down navigation**.

This is the product demo path. Bigtop is the primary acceptance corpus; a
second arbitrary local repo/landscape proves the path is not Bigtop-specific.

## Setup

**Agent-installable path (copy to Cursor/OpenCode/Kimi/Codex/etc.):**

```text
PORTOLAN_PATH=<absolute Portolan checkout>
TARGET_ROOT=<absolute local repo or multi-repo root>
BUNDLE_DIR=<absolute empty output dir>

Use Portolan as an agent-installable landscape atlas layer.
Read PORTOLAN_PATH/harness/SKILL.md, run the scan, open the viewer, then answer
from bundle-query/source/drill-down routes. Preserve unknown, cannot_verify, and
not_assessed.
```

The agent should normally run:

```bash
"$PORTOLAN_PATH/scripts/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
```

For human-only runs where blocking in the viewer is fine, omit `--no-viewer`.
For locked-down corporate-style runs:

```bash
"$PORTOLAN_PATH/scripts/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" \
  --yes --skip-install --no-viewer
```

Then open:

```bash
cd "$PORTOLAN_PATH/viewer"
node scripts/build-static.js
node scripts/serve.js --bundle "$BUNDLE_DIR"
```

**Second-target reproducibility smoke (not Bigtop-specific):**

```bash
bash scripts/harness-reproducible-atlas-smoke.sh \
  /path/to/another/local/repo-or-landscape \
  /tmp/portolan-repro-atlas
```

This bounded smoke uses the same harness path, keeps missing OSS tools as gaps,
and verifies atlas artifacts plus bundle-query.

**Single repo (portolan) — useful for quick query eval, not sufficient as the
only reproducibility proof:**

```bash
scripts/portolan-scan.sh . /tmp/portolan-self --no-viewer --yes --skip-install
# optional Edges evidence graph:
scripts/portolan-scan.sh . /tmp/portolan-self --yes --skip-install --no-viewer --with-map-bridge
```

Viewer on self bundle:

```bash
cd viewer && node scripts/build-static.js
node scripts/serve.js --bundle /tmp/portolan-self --port 4173
```

**Bounded multi-repo (bigtop quick sample):**

```bash
scripts/portolan-scan.sh ~/projects/bigtop-landscape/repos /tmp/portolan-bigtop \
  --yes --limit-repos 3 --producers semgrep,syft
```

**CTO multi-repo demo (bigtop-10, spec 108):**

```bash
scripts/portolan-scan.sh ~/projects/bigtop-landscape/repos /tmp/portolan-bigtop10 \
  --limit-repos 10 --cross-repo-dup --yes --no-viewer
```

`--cross-repo-dup` runs **pairwise bounded** jscpd across every repo pair. Completion
is recorded in `producers/jscpd-cross/_scan.json`; proven zero cross-repo clones
after a complete scan is tier-A evidence (manifest `cross_repo_duplication.status=complete`).
`gap-cross-repo-dup` appears only when one or more pairs fail—not as opt-in degradation.

Strict bigtop-10 acceptance (not default CI):

```bash
scripts/harness-bigtop10-acceptance.sh /tmp/portolan-bigtop10
```

**Full landscape stress (18 repos, spec 091):**

```bash
scripts/portolan-scan.sh ~/projects/bigtop-landscape/repos /tmp/portolan-bigtop-full \
  --no-viewer --yes --shard-timeout 600 --jscpd-memory-mb 2048
```

Expect 30–90+ minutes. Failed shards appear in gaps (not a scan abort).

`portolan-scan` opens the viewer automatically. For a fixed port:

```bash
cd viewer && node scripts/build-static.js
node scripts/serve.js --bundle /tmp/portolan-portolan --port 4173
```

Open http://127.0.0.1:4173/

## 6-step demo script (agent-first atlas)

1. **Agent entrypoint** — Show the prompt above and the agent reading
   `harness/SKILL.md`.
2. **Atlas overview** — Viewer answers what landscape was scanned, how many
   repos/components are visible, and what is missing.
3. **Map** — Select a component and show its dependency corridor, layer, source
   routes, and relationship records.
4. **Risks/findings** — Explain top pain points by kind/severity/repo. Do not
   mix agent claims into ranked tool findings.
5. **Drill-down** — Click finding/source route; open read-only source snippet.
6. **Agent handoff** — Run bundle-query for repos, relationships, hotspots,
   search/source, and show how the next agent continues from the same bundle.

## Agents (query at answer time)

Portolan does not ship pre-built Q&A. Agents query the bundle:

```bash
scripts/portolan-bundle-query.sh hotspots --bundle <bundle-dir> --kind duplication --limit 10
```

MCP: `PORTOLAN_BUNDLE_DIR=<bundle> scripts/portolan-bundle-query-mcp.sh` — recipe in `harness/recipes/bundle-query-mcp.md`.

If bundle is truncated, use `hotspots-full.jsonl` through bundle-query; the
Risks tab shows the demo-ranked subset.

## Demo bar (acceptance)

Use **`/tmp/portolan-self`** (real self-target scan). Operator answers without external docs:

| Question | Where in viewer |
| --- | --- |
| What is this target? | Atlas → hero and executive brief |
| How is rank/pressure computed? | Atlas → executive brief; Risks → clusters |
| How do I navigate? | Atlas → guided routes and cockpit |
| How many repos? | Atlas → metrics; Sources → component rows |
| Top problems? | Atlas → inspection pressure; Risks → clusters |
| Why is this finding pain? | Risks or inspector → Evidence drill-down |
| What was not checked? | Edges → visibility gaps; Agent loop → bundle contract |
| Optional map-bridge relationships? | Edges → evidence graph (only with `--with-map-bridge`) |

**Agent query eval (Lane B):** `scripts/run-query-eval.sh --self --run` after self-scan.

Compare with `docs/test-corpora/apache-bigtop/examples/map-excerpt.md` for section parity.

## CTO scenario (multi-repo, spec 108 and atlas demo)

Use **`/tmp/portolan-bigtop10`** (10 repos, `--cross-repo-dup`). The concerned-CTO
walkthrough — every answer states which tier the knowledge is:

| CTO question | Where | Tier |
| --- | --- | --- |
| What repos do I have and what does each do? | Sources → component rows; Atlas → selected component facts | A from manifests/README; purpose one-liner may be a labeled B claim |
| How are they connected? | Atlas → relationship corridor; Edges → selected edges | A (metadata-visible); **not** runtime topology |
| Do teams copy code between repos? | Risks → cross-repo duplicates; Edges → `cross-repo-duplication` when present | A (jscpd cross pass, opt-in) |
| Which repo is riskiest? | Atlas → inspection pressure; Risks → clusters; component drill-down top findings | A (tool findings only) |
| What does the agent *think* it means? | Agent loop → Agent analysis claims; component inspector → Agent claims | B/C/D — labeled, never mixed into ranked findings |
| What was not checked? | Edges → visibility gaps; Agent loop → rejected claims/import report | honesty layer |

Agent analysis pass (full cycle, including a rejected negative case):

```bash
# agent writes claims per harness/SKILL.md + harness/guardrails/analysis-claims.md
scripts/import-analysis-claims.sh /tmp/portolan-bigtop10 /tmp/bigtop10-claims.jsonl
jq '.rejected' /tmp/portolan-bigtop10/claims-import-report.json   # broken refs listed with reasons
```

**CTO query eval:** `scripts/run-query-eval.sh --run /tmp/portolan-bigtop10` (C1–C5
cover repos, relationships, cross-repo duplication, per-repo risk, claims).

## Talking points

- Gaps/truncation = honest limits (`not_assessed`, budget cap).
- Every claim ties to `producer_ref` (jscpd, semgrep, syft, config-scan, ctags).
- No network; local-first.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Empty viewer | Run `node viewer/scripts/build-static.js` first |
| No source snippet | Hotspot has no paths (e.g. dep-hub) — expected |
| Missing tools | Keep default gaps, or remove `--skip-install` only after operator approval |
