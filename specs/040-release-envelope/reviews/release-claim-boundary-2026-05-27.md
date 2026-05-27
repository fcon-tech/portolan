# Release Claim Boundary: Release Envelope

Date: 2026-05-27

Source: `docs/product-claims.md`

## Release-Visible Limits

Release notes and release checklist must preserve these limits:

- UI Cursor/Composer behavior is `not_assessed`; comparison evidence is for
  headless Cursor on the fixed local Bigtop target.
- Complete inherited-estate coverage is not proven by repository count.
- Runtime service topology remains `not_assessed` without runtime observations.
- OSS producer validation is narrow: Syft/CycloneDX component identity is
  verified for the fixed target, bounded jscpd JSON ingestion is verified on
  the Portolan repository smoke target, the full Bigtop near-clone run remains
  unproven, and Semgrep remains `not_assessed`.
- Output quality depends on local evidence supplied to Portolan. Missing,
  stale, or incomplete inputs must stay visible as gaps.

## Disposition

Accepted for implementation. `docs/release.md` must require maintainers to copy
these limits into release notes instead of replacing them with broader product
claims.
