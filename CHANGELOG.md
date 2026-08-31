# Changelog

## 0.2.0 — 2026-08-31

Verification as the product spine (OpenSpec change `verification-spine`):
the properties Portolan always enforced — anchors, trust labels, receipts,
staleness — become the marketed, queryable product surface.

- **`trust.report`** — the thirteenth MCP tool: one call returns the
  province's verification summary — trust-label distribution, per-kind
  counts, staleness refreshed first, every chart anchor re-sounded
  deterministically with refuted ones named verbatim, ship's-log tail.
  Read-only; no input; deterministic on an unchanged province.
- **Sailing Directions** carry the verification summary; the skill mandates
  calling `trust.report` for the brief, and refuted anchors are reported,
  never smoothed over.
- **Positioning with receipts**: README and the landing page state the
  verification spine, every differentiation claim anchored to committed
  receipts — the self-chart report (`docs/demo/trust-report.md`) and the
  dated competitor trials (`docs/verification-trials.md`, Serena &
  Sourcegraph MCP: no surveyed tool markets the combination).
- **Security hardening**: anchor soundings and staleness walks now refuse
  to read past the target perimeter (realpath containment, symlink-safe);
  the receipt renderer is injection-safe and redacts inline secrets.
- Spec deltas applied to `tools`, `expedition`, `harness`; glossary gains
  the trust report (верификационная сводка).
