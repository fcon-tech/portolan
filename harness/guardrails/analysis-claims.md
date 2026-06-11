# Guardrail: Agent Analysis Claims (tiers B/C/D)

Portolan accepts LLM-authored analysis only as tier-labeled, citation-checked
claims (`claims.jsonl`, spec 106). This guardrail is binding for any agent
writing or presenting claims.

## Tier ladder

- **A. Direct** — tool evidence (`source-visible` / `metadata-visible` /
  `runtime-visible`). Never authored by an LLM. Lives in hotspots,
  relationships, profiles — not in claims.
- **B. Analytical** (`claim_tier: analytical`) — the agent aggregated cited
  bundle evidence. All `cited_refs` must resolve.
- **C. Synthetic** (`claim_tier: synthetic`) — the agent inferred something on
  top of cited evidence. Refs must resolve; the inference itself is unverified.
- **D. Speculative** (`claim_tier: speculative`) — hypothesis. May cite
  nothing, but must stay labeled.

## Hard rules

- Never present a B/C/D claim as a tool-backed fact. When quoting a claim,
  keep its tier and `claim-only` state visible.
- Never put analytical/synthetic claims without at least one valid ref; the
  importer rejects them with a reason — do not retry by stripping the tier to
  speculative unless the statement genuinely is a hypothesis.
- Never invent refs. A ref must come from a bundle-query result
  (`hotspot:<id>`, `gap:<id>`, `relationship:<id>`, `repo:<id>`) or a real file
  (`path:<rel>[:line]`, `producer_ref:<path>`).
- Citing evidence does not upgrade a claim to tier A. The importer never
  raises a tier; neither may you in prose.
- Claims are valid for the bundle snapshot they were imported into. After a
  re-scan, refs may stop resolving; re-import and treat invalidated claims as
  stale, not as still-true.
- Sufficiency of B/C/D knowledge is the user's decision. Portolan's job is to
  keep the tier from laundering into fact; your job is to label honestly.

## Presentation

- Ranked Findings stay tier A only. Claims never mix into hotspot rankings.
- Always show the tier badge (analytical/synthetic/speculative) next to any
  claim statement, including in chat answers.
- When the user asks "how do you know this?", answer with the tier and the
  cited refs, and offer the tier-A evidence behind them.
