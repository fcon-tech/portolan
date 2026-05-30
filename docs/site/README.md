# FCON And Portolan Static Site

This directory contains the first static GitHub Pages site for FCON and
Portolan.

## Local Preview

Preview from the repository root:

```bash
python3 -m http.server 8000 --directory docs/site
```

Then open `http://127.0.0.1:8000/`.

The site is intentionally static:

- no analytics;
- no forms;
- no tracking scripts;
- no external embeds;
- no credentials;
- no server-side behavior.

## Claim Sources

Portolan copy must stay within these maintained repository surfaces:

- `README.md`
- `docs/product-claims.md`
- `docs/demo.md`
- `docs/release.md`
- `docs/releases/v0.1.0.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `SUPPORT.md`

Positive capability claims must map to an `accepted` or `narrowed` claim in
`docs/product-claims.md`. Unsupported, rejected, failed, blocked, unknown, or
`not_assessed` surfaces must be presented as limits, not product wins.
