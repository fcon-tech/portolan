# Quickstart: Public Demo Showcase

Use this checklist after implementation.

1. Prepare the Apache Bigtop target according to `docs/demo.md`. Record whether
   the target was cloned fresh, reused from a local checkout, or blocked.

2. Run the demo from a fresh Portolan checkout:

   ```bash
   scripts/bootstrap-portolan
   .portolan/bin/portolan --version
   .portolan/bin/portolan context prepare --root <bigtop-root> --out .portolan/demo/context
   .portolan/bin/portolan map --root <bigtop-root> --out .portolan/demo/map
   ```

3. Confirm expected artifacts:

   ```bash
   ls .portolan/demo/context .portolan/demo/map
   test -f .portolan/demo/map/summary.json
   test -f .portolan/demo/map/map.md
   test -f .portolan/demo/context/evidence-index.jsonl
   test -f .portolan/demo/context/answer-contract.md
   ```

4. Run one bounded query or slice documented by the demo:

   ```bash
   .portolan/bin/portolan query --bundle .portolan/demo/map --help
   .portolan/bin/portolan graph slice --bundle .portolan/demo/map --help
   ```

5. Check public copy against claim boundaries:

   ```bash
   rg -n "Cursor|Composer|Bigtop|unsupported|not_assessed|cannot_verify|unknown|security|complete|replace" docs/demo.md README.md docs/product-claims.md
   ```

6. Scan committed demo artifacts before publication:

   ```bash
   rg -n "/home/|/Users/|token|secret|password|private|customer|client" docs examples README.md -S
   git diff --check
   go test ./...
   jq empty schema/*.json
   ```

7. Record privacy review and freshness state under this spec's `reviews/`
   directory.
