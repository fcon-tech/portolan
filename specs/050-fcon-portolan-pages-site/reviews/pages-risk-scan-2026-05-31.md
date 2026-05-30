# Pages Risk Scan

**Date**: 2026-05-31

## Scan

Command:

```bash
rg -n "analytics|gtag|plausible|segment|form|iframe|script src|token|secret|password" docs/site .github/workflows -S
```

Result:

- `.github/workflows/pages.yml: id-token: write` is required for GitHub Pages OIDC deployment, not an embedded credential.
- `docs/site/README.md` contains the explicit no-analytics/no-forms policy.
- `docs/site/assets/site.css` contains `text-transform`, a false-positive match for `form`.

## Assessment

verified: no analytics, forms, tracking scripts, external embeds, credential strings, or server-side behavior were found in site HTML.

not_assessed: live GitHub workflow execution and repository Pages settings.
