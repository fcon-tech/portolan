# Design — demo-from-real-scan

## Decision

The published demo is produced by running the full pipeline end-to-end on the
Apache Bigtop landscape. A `make demo` (or equivalent script) runs:

1. `portolan map --root <bigtop>` → raw bundle (graph.json, findings.jsonl)
2. `build-system-map.sh` → system-map.json (normalized, `component:` IDs)
3. `build-atlas-navigation-index.mjs --target <bigtop>` → nav-bundle
4. `build-semantic-investigation.mjs` (from corpus or fixture) → SI sidecar
5. `export-shell.mjs` → atlas.html (single file, all data inlined)

All stages share the same target → coherent IDs. No hand-crafted
system-map.json in the live path.

## ID coherence

The root cause of the previous demo's broken links was that the nav-bundle
enumerated subjects as `repo:<name>` while the system-map used
`component:<name>`. The fix is that BOTH stages derive IDs from the same
selection — the Go core's `selection.Target` objects — so the ID scheme is
consistent by construction.

If the system-map composer prefixes `component:` and the nav-index builder
prefixes `repo:`, a normalization step maps one to the other. The
normalization is a spec requirement, not a hack.

## Fixture retention

The hand-crafted fixture (`docs/site/atlas/system-map.demo.json` +
SI fixture) is retained for:
- Unit tests (the fixture is the test corpus)
- Fallback when the real target is unavailable
- Regression comparison

But the PUBLISHED demo (deployed to GitHub Pages) is always from a real scan.

## Demo rebuild automation

A script (`scripts/rebuild-demo.sh`) runs the full pipeline and deploys:
```bash
scripts/rebuild-demo.sh --target <bigtop-landscape> --out docs/site/atlas/
```

This is the single command that produces the demo. It is idempotent: running
it twice produces the same output.

## Status

Design proposal. The implementation depends on multi-language-dependency-
detection and jvm-source-references landing first.

## Reversibility

High. The demo script is additive; the fixture path is retained.
