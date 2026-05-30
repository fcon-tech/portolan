# Quickstart: FCON And Portolan GitHub Pages Site

Use this checklist after implementation.

1. Inspect site files and publishing source:

   ```bash
   find docs/site .github/workflows -maxdepth 3 -type f | sort
   rg -n "pages|github-pages|deploy-pages|fcon|portolan" docs/site .github/workflows README.md -S
   ```

2. Check claim boundaries:

   ```bash
   rg -n "Cursor|Composer|Bigtop|security|observability|service catalog|complete|replace|benchmark|enterprise" docs/site docs/product-claims.md README.md -S
   ```

3. Check privacy and third-party risk:

   ```bash
   rg -n "analytics|gtag|plausible|segment|form|iframe|script src|token|secret|password" docs/site .github/workflows -S
   ```

4. Preview locally using the implementation's documented command, or record the
   blocker if no local preview is available.

5. Record GitHub Pages state:

   - repository;
   - publishing source;
   - deployment result;
   - URL;
   - custom domain state;
   - HTTPS state.

6. Run baseline checks for repository changes:

   ```bash
   go test ./...
   jq empty schema/*.json
   git diff --check
   ```
