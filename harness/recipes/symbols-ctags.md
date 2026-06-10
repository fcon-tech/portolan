# Recipe: Universal Ctags Symbol Index

## Prerequisites

- `ctags` (Universal Ctags 6.x) on PATH (operator-approved).

## Bounded scan

Limit to selected repos or top-level source dirs to control output size.

```bash
TARGET=<absolute-target-root>
OUT=<orient-dir>/producers/ctags
mkdir -p "$OUT"
ctags --output-format=json --fields=+nKz -R \
  --exclude=.git --exclude=node_modules --exclude=vendor \
  -f "$OUT/tags.json" "$TARGET"
```

## Re-ingest

```bash
scripts/build-orient-bundle.sh "$TARGET" "$ORIENT_DIR"
```

## Failure modes

| Failure | Result |
| --- | --- |
| ctags missing | Symbol layer `not_assessed` |
| Huge JSON | Budget symbols in build script; full ref graph `not_assessed` |
