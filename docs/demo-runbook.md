# Portolan Demo Runbook

Live demo for a newcomer: **landscape report in 10 seconds** → **findings by section** → **gaps** → **drill-down to source**.

## Setup

**Single repo (portolan) — recommended for demo bar / query eval:**

```bash
scripts/portolan-scan.sh . /tmp/portolan-self --no-viewer --yes
# optional Graph hints tab:
scripts/portolan-scan.sh . /tmp/portolan-self --yes --with-map-bridge
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

## 5-step demo script (report-first)

1. **Overview tab (default)** — Project card: language, scale, maturity (README/CI/tests/Docker), repo matrix, findings shown vs scan total, top “where to look first”.
2. **Gaps tab** — What was **not** assessed (`not_assessed` / `cannot_verify`); not hidden findings.
3. **Findings tab** — Sections by kind (map.md parity), then folder tree + ranked list.
4. **Search & filter** — Header search hits the code index (`search-index.jsonl`); filter chips and views (Tour top 15, Code pain, Config).
5. **Graph hints tab** — Optional relationship hints when `map-bridge/` exists (after `portolan map` + `build-map-bridge.sh`); not a call graph.
6. **Drill-down** — Click a finding → detail + **Source** snippet (read-only local files).

## Agents (query at answer time)

Portolan does not ship pre-built Q&A. Agents query the bundle:

```bash
scripts/portolan-bundle-query.sh hotspots --bundle <bundle-dir> --kind duplication --limit 10
```

MCP: `PORTOLAN_BUNDLE_DIR=<bundle> scripts/portolan-bundle-query-mcp.sh` — recipe in `harness/recipes/bundle-query-mcp.md`.

If bundle is truncated, use **Show all findings from scan** on the Findings tab.

## Demo bar (acceptance)

Use **`/tmp/portolan-self`** (real self-target scan). Operator answers without external docs:

| Question | Where in viewer |
| --- | --- |
| What is this target? | Overview → landscape card |
| How is rank computed? | Overview → rank explainer; Findings → Tour view |
| How do I navigate? | Overview → «How to use this report» |
| How many repos? | Overview → repo table |
| Top problems? | Overview → next steps; Findings → sections |
| Why is this finding pain? | Findings → click row → «Why is this here?» + severity |
| What was not checked? | Gaps tab |
| Optional relationships? | Graph hints tab (only with `--with-map-bridge`) |

**Agent query eval (Lane B):** `scripts/run-query-eval.sh --self --run` after self-scan.

Compare with `docs/test-corpora/apache-bigtop/examples/map-excerpt.md` for section parity.

## CTO scenario (multi-repo, spec 108)

Use **`/tmp/portolan-bigtop10`** (10 repos, `--cross-repo-dup`). The concerned-CTO
walkthrough — every answer states which tier the knowledge is:

| CTO question | Where | Tier |
| --- | --- | --- |
| What repos do I have and what does each do? | Repos tab → cards (langs, activity, maturity, purpose line) | A from manifests/README; purpose one-liner may be a labeled B claim |
| How are they connected? | Repos tab → «Connections between repos» (depends-on, uses-image, shared-dependency) | A (metadata-visible); **not** runtime topology |
| Do teams copy code between repos? | Findings → cross-repo duplicates (high severity); Repos → connections `cross-repo-duplication` | A (jscpd cross pass, opt-in) |
| Which repo is riskiest? | Overview → «Findings by repository» severity columns; click → drill-down top findings | A (tool findings only) |
| What does the agent *think* it means? | Repo drill-down → «Agent analysis» B/C/D blocks; Overview → landscape claims | B/C/D — labeled, never mixed into ranked findings |
| What was not checked? | Gaps tab (+ rejected claims in `claims-import-report.json`) | honesty layer |

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
| Missing tools | Re-run wizard with `--yes` or install jscpd/semgrep/syft |
