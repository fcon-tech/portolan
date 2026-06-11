# Recipe: Configuration Surface Inventory

## Prerequisites

- `jq` and standard `find` (no install; read-only).
- Respects repo `.gitignore` via `git check-ignore` when `.git` is present.

## Bounded scan

Per repository shard (portolan-scan default):

```bash
REPO=<absolute-repo-path>
SLUG=<repo-slug>
OUT=<bundle-dir>/producers/config/${SLUG}.jsonl
scripts/scan-config-surfaces.sh "$REPO" "$OUT"
```

## Surface kinds

`dockerfile`, `docker-compose`, `kubernetes`, `env-file`, `ci-workflow`, `terraform`, `nginx`

## Re-ingest

```bash
scripts/build-portolan-bundle.sh "$TARGET" "$BUNDLE_DIR"
```

Hotspots use kind `config`, grouped by `surface_kind` per repo (not one hotspot per file).

## Failure modes

| Failure | Result |
| --- | --- |
| Permission denied on path | skipped file; partial inventory |
| Empty repo | no config hotspots; no gap (inventory is optional) |
