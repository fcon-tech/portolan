# Recipe: jscpd Duplication Scan

## Prerequisites

- Node.js and `npx jscpd` or global `jscpd` install (operator-approved).
- Target path is read-only for Portolan; jscpd must not modify source.

## Single repository

```bash
TARGET=<absolute-target-root>
OUT=<orient-dir>/producers/jscpd
mkdir -p "$OUT"
jscpd "$TARGET" \
  --reporters json \
  --output "$OUT" \
  --min-lines 5 \
  --min-tokens 50 \
  --threshold 999999 \
  --ignore "**/node_modules/**,**/.git/**,**/vendor/**"
```

## Multi-repo (sharded)

Discover git repos under the landscape root, then run one jscpd command per repo:

```bash
ROOT=<landscape-root>
OUT=<orient-dir>/producers/jscpd
mkdir -p "$OUT"
while IFS= read -r repo; do
  name=$(basename "$repo")
  jscpd "$repo" --reporters json --output "$OUT/$name" \
    --min-lines 5 --min-tokens 50 --noSymlinks true || true
done < <(find "$ROOT" -name .git -type d -prune | sed 's|/.git||')
```

Failed shards do not produce duplication metrics; mark duplication `not_assessed`
for that repo in the orient bundle.

## Re-ingest

```bash
scripts/build-orient-bundle.sh "$TARGET" "$ORIENT_DIR"
```

## Failure modes

| Failure | Result |
| --- | --- |
| OOM / timeout | Shard smaller; gap record, not invented clones |
| No JSON output | `not_assessed` duplication |
| Missing jscpd | Skip; viewer shows duplication gap badge |
