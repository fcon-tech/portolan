# Spec 058 Review Findings

## Executive Summary

Spec 058 is a well-constructed evidence/proof slice that **does not** wrongly redefine the user goal. It preserves the original objective's structure while adding necessary boundedness. However, there are **coherence issues** in the task completion claims and **potential overreach** in the parity rubric's C9 threshold language.

---

## Findings Table

| # | Severity | Finding | Evidence | Recommendation | Verdict | Not Assessed |
|---|----------|---------|----------|----------------|---------|------------|
| F01 | **medium** | Tasks T006-T011 marked `[x]` but contain no actual probe execution evidence in the packet; they are reconstruction/planning artifacts masquerading as completed work | T006-T011 are `[x]` but ledger shows only inspection summaries, no tool invocation timestamps, no command outputs, no reproducible scripts | Separate "reconstructed status" `[~]` from "executed probe" `[x]`; add `reconstruction.md` for inferred state vs `probe-ledger.md` for actual runs | Tasks misrepresent work done; content is honest but status surface is incoherent | n/a |
| F02 | **medium** | Parity rubric C9 ("Enterprise parity threshold") sets a threshold that **no spec in this series can ever meet** as currently scoped: it requires C4 **and** C6 verified, but FR-003/FR-005 allow explicit `not_assessed` as valid output | SC-001/SC-002 explicitly accept `not_assessed` as success; C9 contradicts this by making C4∧C6 a hard gate for "enterprise parity" | Split C9 into: C9a "Narrowed enterprise parity (C4 or C6 excluded)" and C9b "Full enterprise parity (all C1-C8)"; or add escape clause to C9 | C9 threshold is honest about full parity but may be **too broad a stick**: it prevents even *bounded* enterprise-intelligence claims when C4 is infeasible for local-first operation | Whether C9 should be achievable in the Bigtop series at all |
| F03 | **low** | Cursor+Portolan stress "proves" improvement on C3 by **downgrading** Cursor-only's "verified" to Portolan's "partial" — this is epistemically correct but not a capability improvement, it's a **conservatism improvement** | C3 row: Cursor-only=verified, Portolan=partial; C8 calls this "improvement" | Clarify in C8 that "improvement" includes correct downgrading/narrowing, not only additive correctness | Acceptable; rubric is honest about improvement type | Whether Portolan could ever make C3 "more verified" than static evidence allows |
| F04 | **low** | "Cursor+Portolan stress proves anything too broad" — **not proven in this slice**, but the rubric's very existence prevents broad claims | Claim rules explicitly forbid enterprise parity when C4/C6 missing; stress scoring respects this | None needed; prevention mechanism is working | Spec 058 **successfully constrains** broad claims; no finding of overproof | Whether the rubric itself is too broad (it has 9 criteria, could be narrower) |
| F05 | **medium** | Runtime/symbol blockers are **honest but potentially circular**: "no safe producer exists" because none were installed, but FR-002 forbids installing new tools without "explicit design approval" | T007/T010 say "not applicable: no safe...exists"; FR-002 blocks starting services/mutation, not tool installation per se | Clarify whether tool installation is blocked by FR-002 or by local-first preference; if the former, document the design approval process | Blockers are **honest as stated** but the "safe" framing elides whether absence is due to policy or environment | Whether installing `universal-ctags` or `scip` locally would violate constitution |
| F06 | **low** | Privacy/boundary review claims "no credentials were read" but does not assess whether `.portolan` outputs or stress artifacts contain sensitive paths | Bigtop landscape path is in `/home/fall_out_bug/projects/` — username exposed; no assessment of whether this is sensitive | Add path-sanitization check to privacy review; or document that local paths are acceptable in this context | Minor; local-first operation makes path exposure expected | Whether committed artifacts need path obfuscation |

---

## Cross-Cutting Assessment

| Dimension | Verdict |
|-----------|---------|
| **User goal redefinition** | ✅ **Clean**. Original: "доводя до verified: Portolan понимает архитектуру Bigtop..." Spec 058 preserves this while adding boundedness via rubric. No goal drift. |
| **Runtime/symbol/parity blocker honesty** | ✅ **Honest**. All blockers trace to absent evidence, not hidden failures. C9 threshold is debatable but explicitly stated. |
| **Cursor+Portolan stress breadth** | ✅ **Constrained**. Stress uses same rubric for both lanes, marks unsupported states, and does not claim unrestricted improvement. |
| **Tasks/status coherence** | ⚠️ **Incoherent**. `[x]` tasks include reconstruction (T005), "not applicable" probes (T007, T010), and planning artifacts. The status surface conflates "we checked and found nothing" with "we executed and verified." |

---

## Recommended Actions

1. **Fix task status semantics**: Use `[~]` for reconstructed/inferred state, `[x]` only for executed probes with command artifacts. Move T005-T011 to a `reconstruction.md` or rename to `T006r`, `T007r`, etc.

2. **Clarify C9 achievability**: Either make C9 explicitly aspirational ("full enterprise parity — not expected in this series") or add narrowed variant C9a that allows bounded claims when C4/C6 are excluded by scope.

3. **Document tool installation boundary**: If `scip`/`ctags` installation is constitutionally blocked, say so in assumptions; if merely not done, distinguish "not installed" from "cannot install."

4. **Complete T017-T018**: Independent review and PR creation are `[ ]`; spec is still "Planning" per header.
