# Post-Slice Review Verdict: **pass_with_changes**

---

## Major Findings

### M1 — Evaluation file discovery order may surface stale/wrong evaluations
The review packet states evaluations are read from root, root `.portolan/`, root `reports/`, repository root, repository `.portolan/`, repository `reports/`. First-match wins. In a monorepo where the repo root ≠ the scanned sub-repo, a stale evaluation at a higher level could be silently accepted for a sub-repo it doesn't describe.

**Why major:** Violates the blocking edge case "partial producer coverage can be overextended to a whole repository or estate." A root-level evaluation could be overread as verified support for a child repo.

**Recommendation:** Either (a) scope evaluations by matching a `repository` or `path_prefix` field in the record against the current scan target, or (b) prefer repository-local paths over root paths (reverse the priority so closer-to-target wins).

### M2 — `candidate_tools` object form emits two `not_assessed` states that could be conflated downstream
`verification_state: not_assessed` and `support_state: candidate_only` are semantically distinct but both communicate "don't trust this." A downstream consumer that only checks one field could misinterpret readiness.

**Why major:** The decision gate explicitly flags "candidate tools can be overread as verified support." Dual not-assessed fields create two failure modes for the same guardrail.

**Recommendation:** Document in `answer-contract.md` or the schema `description` that both fields **must** be checked independently, or collapse into a single `candidate_status` enum to eliminate partial-check risk.

---

## Minor Findings

### m1 — Schema filename is singular, record types are plural
`producer-family.schema.json` validates three record types (`producer-recommendation`, `producer-evaluation`, `producer-coverage`). The singular name is fine, but a one-line `description` at the schema root noting it covers all three would aid discoverability.

### m2 — No explicit protection against `producer-family-records.jsonl` containing non-evaluation types
The packet says "validates and surfaces only evaluation records" from these files, which is correct behavior. But if a `producer-recommendation` record appears in `producer-family-records.jsonl`, silently dropping it (rather than warning) could mask misconfiguration. Consider a `cannot_verify` evidence entry for skipped records, consistent with the malformed-file path.

### m3 — Four hardcoded coverage families may need extension documentation
Dependency, symbol-index, API/catalog, and runtime-observation are the only families getting auto-generated `producer-coverage` records. This is appropriately conservative per the decision gate, but a code comment or spec note explaining *why* these four (and not, e.g., license-compliance or SAST) would prevent future "just add it" drift.

---

## Not Assessed

- **Actual file contents** of `contextprep.go`, `producerfamily.go`, schema, fixtures, and test files — packet describes behavior; no source to inspect.
- **Schema structural correctness** (required fields, pattern constraints, enum completeness) — not_assessed.
- **Test coverage adequacy** (whether guardrail cases exercise all rejection paths) — not_assessed.
- **CLI help text accuracy** — not_assessed.
- **JSONL fixture well-formedness** — not_assessed (jq pass noted but not inspected).

---

## Summary

The implementation faithfully follows the decision gate: no new CLI surface, no runner, no language adapter, no scoring, no probing. Evidence-state honesty is strong — everything stays `not_assessed` unless externally provided. The two major findings are both about downstream misinterpretation risk, not about the implementation being wrong. Addressing M1 (scoping) and M2 (dual-field documentation or collapse) would bring this to a clean **pass**.
