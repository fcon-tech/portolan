# Recipe: Semgrep Local Config Scan

## Prerequisites

- `semgrep` on PATH (operator-approved install).
- Local rule pack only — no registry fetch by default.

## Command

```bash
TARGET=<absolute-target-root>
RULES=<portolan-checkout>/harness/recipes/semgrep-rules
OUT=<orient-dir>/producers/semgrep
mkdir -p "$OUT"
semgrep scan "$TARGET" \
  --config "$RULES" \
  --json \
  --output "$OUT/findings.json" \
  --metrics off
```

If no local rules exist yet, use a minimal config:

```bash
semgrep scan "$TARGET" --config p/default --json --output "$OUT/findings.json" --metrics off
```

Only after operator explicitly approves network rule sources.

## Re-ingest

```bash
scripts/build-orient-bundle.sh "$TARGET" "$ORIENT_DIR"
```

## Failure modes

| Failure | Result |
| --- | --- |
| Semgrep errors | Preserve stderr; static findings `not_assessed` |
| Empty findings | Valid; no static hotspots |
| Registry config without approval | Blocked — do not run |
