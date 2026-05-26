# Quickstart: OSS Producer Acceptance

Run from the Portolan repository root.

```bash
test -d /home/fall_out_bug/projects/bigtop-landscape
command -v jscpd || true
command -v syft || true
command -v semgrep || true
rm -rf /tmp/portolan-035-bigtop-context
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /tmp/portolan-035-bigtop-context \
  --profile cursor \
  --force
jq empty /tmp/portolan-035-bigtop-context/oss-plan.json
jq '.tools[] | {id,family,producer,status,reason}' \
  /tmp/portolan-035-bigtop-context/oss-plan.json
```

Do not install or run producer tools without explicit approval. If a producer is
absent, record the acceptance as blocked for that producer instead of treating
the recipe as proof.

After a producer writes under `<context-dir>/tool-outputs/`, rerun context
preparation with `--force`. The context pack must preserve those producer
outputs and record them in `tool-registry.json`; otherwise the producer workflow
is not verified.
