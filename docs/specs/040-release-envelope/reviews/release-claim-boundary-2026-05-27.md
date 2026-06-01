# Release Claim Boundary: Release Envelope

Date: 2026-05-27

Source: `docs/product-claims.md`

## Release-Visible Limits

Release notes and release checklist must preserve these limits:

- UI Cursor/Composer behavior is outside the current required acceptance scope;
  comparison evidence is for headless Cursor on the fixed local Bigtop target
  and Bigtop operator evidence is for Cursor Agent CLI / Composer 2.5.
- Complete inherited-estate coverage is not proven by repository count.
- Runtime service topology remains `not_assessed` without runtime observations.
- OSS producer validation is narrow: Syft/CycloneDX component identity is
  verified for the fixed target, bounded jscpd JSON ingestion is verified on
  the Portolan repository smoke target, local Semgrep JSON preservation is
  verified with a local config, bounded raw Graphify node-link import is
  verified, bounded Repomix file-inventory import is verified, bounded
  SCIP/Serena-style JSON symbol-index import is verified, and the full Bigtop
  near-clone run, full semantic Graphify integration, SCIP protobuf/real
  indexer output, real Serena export/MCP behavior, and Repomix
  source/redaction semantics remain unproven or `not_assessed`.
- Output quality depends on local evidence supplied to Portolan. Missing,
  stale, or incomplete inputs must stay visible as gaps.

## Disposition

Accepted for implementation. `docs/release.md` must require maintainers to copy
these limits into release notes instead of replacing them with broader product
claims.
