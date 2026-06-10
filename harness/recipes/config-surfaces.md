# Recipe: Configuration Surface Inventory

## Prerequisites

- `jq` and standard `find` (no install; read-only).

## Bounded scan

Per repository shard (orient-wizard default):

```bash
REPO=<absolute-repo-path>
SLUG=<repo-slug>
OUT=<orient-dir>/producers/config/${SLUG}.jsonl
scripts/scan-config-surfaces.sh "$REPO" "$OUT"
```

## Surface kinds

`dockerfile`, `docker-compose`, `kubernetes`, `env-file`, `ci-workflow`, `terraform`, `nginx`

## Re-ingest

```bash
scripts/build-orient-bundle.sh "$TARGET" "$ORIENT_DIR"
```

Hotspots use kind `config`, grouped by `surface_kind` per repo (not one hotspot per file).

## Failure modes

| Failure | Result |
| --- | --- |
| Permission denied on path | skipped file; partial inventory |
| Empty repo | no config hotspots; no gap (inventory is optional) |
