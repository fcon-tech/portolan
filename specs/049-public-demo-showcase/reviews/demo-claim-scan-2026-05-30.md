# Demo Claim Scan - 2026-05-30

## Scope

Compared `docs/demo.md` with `docs/product-claims.md` for Bigtop, Cursor,
Composer, completeness, runtime, security, replacement/readiness, and weak
evidence-state wording.

Command:

```bash
rg -n "reduced unsupported claims|Cursor|Composer|complete|runtime|security|replace|readiness|benchmark|Bigtop|not_assessed|unknown|cannot_verify|arbitrary|external" docs/demo.md docs/product-claims.md README.md
```

## Result

State: verified.

Accepted or narrowed claims in `docs/demo.md`:

- Public target is Apache Bigtop.
- Demo is local evidence preparation, not a benchmark or readiness gate.
- Existing-landscape smoke preserved `unknown`, `cannot_verify`, and
  `not_assessed` records.
- Fixed local Bigtop headless Cursor comparison reduced unsupported claims from
  12 to 0.

Limits kept visible in `docs/demo.md`:

- no UI Cursor/Composer validation;
- no arbitrary external target validation;
- no complete inherited-estate coverage;
- no complete runtime topology;
- no broad OSS producer value;
- generated full outputs require privacy/freshness review before sharing.

## Drift Findings

None accepted. The demo copy stays within `docs/product-claims.md`.

## Not Assessed

- Whether external readers will interpret the demo as marketing despite the
  explicit boundary language.
- Any future website or screenshot copy; this scan covers current text files
  only.
