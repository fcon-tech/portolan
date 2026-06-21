# Recipe: Universal Ctags Symbol Index

## Prerequisites

- `ctags` (Universal Ctags 6.x) on PATH (operator-approved).

## Bounded scan

Limit to selected repos or top-level source dirs to control output size.

```bash
TARGET=<absolute-target-root>
OUT=<bundle-dir>/producers/ctags
mkdir -p "$OUT"
# Prefer gitignore-aware file list (portolan-scan default):
git -C "$TARGET" ls-files -co --exclude-standard > /tmp/ctags-files.txt
ctags --output-format=json --fields=+nKz --links=no \
  -L /tmp/ctags-files.txt -f "$OUT/tags.json"
# Run from repo root: (cd "$TARGET" && ctags ... -L /tmp/ctags-files.txt ...)
```

## Re-ingest

```bash
scripts/build-portolan-bundle.sh "$TARGET" "$BUNDLE_DIR"
```

## Failure modes

| Failure | Result |
| --- | --- |
| ctags missing | Symbol layer `not_assessed` |
| Huge JSON | Budget symbols in build script; full ref graph `not_assessed` |
