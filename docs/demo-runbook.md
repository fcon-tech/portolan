# Portolan Demo Runbook

Live demo for a newcomer: **landscape report in 10 seconds** → **findings by section** → **gaps** → **drill-down to source**.

## Setup

**Single repo (portolan):**

```bash
scripts/portolan-scan.sh . /tmp/portolan-portolan --yes
```

**Bounded multi-repo (bigtop quick sample):**

```bash
scripts/portolan-scan.sh ~/projects/bigtop-landscape/repos /tmp/portolan-bigtop \
  --yes --limit-repos 3 --producers semgrep,syft
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

Operator answers without external docs:

| Question | Where in viewer |
| --- | --- |
| What is this target? | Overview → landscape card |
| How many repos? | Overview → repo table |
| Top problems? | Overview → next steps; Findings → sections |
| What was not checked? | Gaps tab |

Compare with `docs/test-corpora/apache-bigtop/examples/map-excerpt.md` for section parity.

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
