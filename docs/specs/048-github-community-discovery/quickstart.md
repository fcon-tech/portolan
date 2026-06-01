# Quickstart: GitHub Community Discovery

Use this checklist after implementation.

1. Inspect community files:

   ```bash
   ls CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md SUPPORT.md .github
   find .github -maxdepth 3 -type f | sort
   ```

2. Check evidence-state language:

   ```bash
   rg -n "not_assessed|unknown|cannot_verify|blocked|failed|verified" CONTRIBUTING.md SECURITY.md SUPPORT.md .github README.md
   ```

3. Check for unsupported public claims:

   ```bash
   rg -n "replace|observability|service catalog|security scanner|certification|SLA|complete estate|modernization" README.md CONTRIBUTING.md SECURITY.md SUPPORT.md .github docs/product-claims.md -S
   ```

4. Run docs checks:

   ```bash
   git diff --check
   go test ./...
   jq empty schema/*.json
   ```

5. If GitHub settings are applied, record evidence for:

   - description;
   - homepage;
   - topics;
   - private vulnerability reporting state;
   - badges;
   - community profile state;
   - Scorecard or Best Practices state.

6. If GitHub settings are not applied, record them as `not_assessed` or
   `blocked`, not verified.
