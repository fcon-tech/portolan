## Verdict: **Needs tightening** — 4 findings, 1 not_assessed

---

### Findings

| # | Finding | Severity |
|---|---------|----------|
| 1 | **Maturity mismatch: `graph.json` labeled `tooling`** | Medium |
| 2 | **Harness readiness rule honored but under-documented for OpenCode** | Low |
| 3 | **YAGNI/DRY: "Does not…" negations are consistent but verbose** | Low |
| 4 | **Acceptance matrix lanes referenced but not linked** | Low |

---

### Detail

**1. `graph.json` maturity downgrade warranted**
- Claimed `tooling`, but description says "Too large for many first prompts" — this is a first-run *limitation*, not a tooling-only surface.
- `summary.json` + friends are `stable-first-run`; `graph.json` is the full graph they defer to. Suggest `stable-first-run` with caveat, or split into `graph.json` (stable) and `graph.json` consumption guidance (tooling).

**2. OpenCode lane honesty is good, wording could be sharper**
- "The recorded external-output default-permission lane failed" — clear that runtime is `not_assessed`. But the table says `tooling` for the adapter doc, which is correct (static guidance). No violation, just verify this distinction is explicit in `agent/ACCEPTANCE.md`.

**3. "Does not…" pattern — consistent, not DRY**
- Every `stable-first-run` row repeats "Does not X" in Not Supported. This is honest but could collapse to a matrix preamble: *"All `stable-first-run` surfaces are local-only, read-only, and do not perform analysis themselves unless noted."* Then per-row exceptions only. Not a bug, a style debt.

**4. Acceptance matrix evidence is cited, not linked**
- "Acceptance matrix lanes" and "Acceptance matrix evidence" appear twice in Routes but no anchor to `agent/ACCEPTANCE.md`. Add relative links.

---

### Not Assessed

| Item | Why |
|------|-----|
| Runtime end-to-end for Cursor UI, OpenCode external-output, MCP/LSP | Correctly marked `not_assessed` or `future`; no false claims detected |
| Actual test coverage % behind "Go tests and CLI smoke" | Out of scope for doc review |

---

### Concise Fix List

1. `docs/product-maturity-matrix.md` — reconsider `graph.json` maturity label
2. `docs/onboarding.md` — link `Acceptance matrix` → `../agent/ACCEPTANCE.md`
3. `docs/product-maturity-matrix.md` — consider preamble DRY for `Does not…` negations
