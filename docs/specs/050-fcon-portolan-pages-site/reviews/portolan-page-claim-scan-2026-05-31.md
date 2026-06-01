# Portolan Page Claim Scan

**Date**: 2026-05-31

## Scope

User Story 2: evaluators can inspect Portolan without reading the whole repository, while install, release, demo, product claims, GitHub, contribution, security, and support routes stay visible.

## Review Evidence

| Reviewer | Status | Verdict | Notes |
| --- | --- | --- | --- |
| `zai/glm-5.1` | assessed | PASS | Confirmed required routes are present and Bigtop/agent claims stay within `docs/product-claims.md`. |

## Accepted Finding Fixed

- Reviewer suggested narrowing the meta description from broad "codebase questions" to product-claim wording.
- Fixed by changing the meta description to "architecture and estate questions."

## Claim Scan

Positive claims on the page map to `docs/product-claims.md`:

- Local read-only context/map artifacts for agents: accepted.
- Fewer unsupported claims: narrowed to fixed local comparison and presented with visible limits.
- Apache Bigtop: linked as fixed local demo, not broad benchmark proof.
- Complementary positioning: page explicitly says Portolan does not replace Cursor, OpenCode, Codex, Sourcegraph, Backstage, service catalogs, observability, or modernization tools.

## Not Assessed

- Live target URLs.
- UI Cursor/Composer behavior.
- Broad external adoption or benchmark proof.
