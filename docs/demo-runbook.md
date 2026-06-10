# Portolan Demo Runbook

Live demo for a newcomer: **where code pain is** → **filter** → **directory tree** → **source**.

## Setup (two commands)

**Single repo (portolan):**

```bash
scripts/orient-wizard.sh . /tmp/orient-portolan --yes
```

**Bounded multi-repo (bigtop quick sample):**

```bash
scripts/orient-wizard.sh ~/projects/bigtop-landscape/repos /tmp/orient-bigtop \
  --yes --limit-repos 3 --producers semgrep,syft
```

**Full landscape stress (18 repos, spec 091):**

```bash
scripts/orient-wizard.sh ~/projects/bigtop-landscape/repos /tmp/orient-bigtop-full \
  --no-viewer --yes --shard-timeout 600 --jscpd-memory-mb 2048
```

Expect 30–90+ minutes. Failed shards appear in gaps (not a wizard abort).
Use viewer on the result: `node viewer/scripts/serve.js --bundle /tmp/orient-bigtop-full`

Wizard opens viewer automatically. For a fixed port:

```bash
cd viewer && node scripts/build-static.js
node scripts/serve.js --bundle /tmp/orient-portolan --port 4173
```

Open http://127.0.0.1:4173/

## 5-step demo script

1. **Context** — Point at header: target path, hotspot count, evidence-backed (not LLM graph).
2. **Search** — Type `TODO` or `duplicate`; list and tree narrow instantly.
3. **Filter** — Toggle `static-finding` or `duplication`; on bigtop, pick a **Repo** chip.
4. **Directory heat map** — Expand a hot folder (severity bar + count); click a hotspot row.
5. **Source** — In Detail, show file paths and the **Source** snippet from local files (read-only).

## Talking points

- Gaps/truncation banner = honest limits (`not_assessed`, budget cap).
- Every claim ties to `producer_ref` (jscpd, semgrep, syft).
- No network; local-first.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Empty viewer | Run `node viewer/scripts/build-static.js` first |
| No source snippet | Hotspot has no paths (e.g. dep-hub) — expected |
| Missing tools | Re-run wizard with `--yes` or install jscpd/semgrep/syft |
