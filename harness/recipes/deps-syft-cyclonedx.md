# Recipe: Syft CycloneDX SBOM

## Prerequisites

- `syft` on PATH (operator-approved).

## Single repository

```bash
TARGET=<absolute-target-root>
OUT=<orient-dir>/producers/syft
mkdir -p "$OUT"
syft scan "dir:$TARGET" -o cyclonedx-json > "$OUT/cyclonedx.json"
```

## Multi-repo (sharded)

```bash
ROOT=<landscape-root>
OUT=<orient-dir>/producers/syft
mkdir -p "$OUT"
while IFS= read -r repo; do
  name=$(basename "$repo")
  syft scan "dir:$repo" -o cyclonedx-json > "$OUT/$name-cyclonedx.json" || true
done < <(find "$ROOT" -name .git -type d -prune | sed 's|/.git||')
```

## Re-ingest

```bash
scripts/build-orient-bundle.sh "$TARGET" "$ORIENT_DIR"
```

## Failure modes

| Failure | Result |
| --- | --- |
| Syft missing | Dep hubs `not_assessed` |
| Huge SBOM | Use graph-slice budget in viewer; do not claim service topology |
