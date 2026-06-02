# Spec 077 Review: Bigtop Callgraph And Symbol Closure

**Spec**: `docs/specs/077-bigtop-callgraph-symbol-closure/`
**Date**: 2026-06-02
**Reviewer**: Independent lane

## Findings

### 1. Evidence-state honesty — verified

The packet consistently preserves `cannot_verify` for full symbol/reference graph, call graph, and enterprise parity. The decision record explicitly rejects upgrading partial Ctags/gopls/jdeps outputs to full graph evidence. No `claim-only` fact is promoted without source.

**Severity**: pass

---

### 2. Local-first/read-only safety — verified

The PATH probe is documented as read-only: no tools installed, no network access, no target mutation, no runtime startup. The producer decision record rejects alternatives that would require installation, build execution, or workspace mutation.

**Severity**: pass

---

### 3. OSS composition posture — verified

The decision record compares SCIP/LSIF, CodeQL, JDT LS, srcML, Joern, and adjacent tools before rejecting native Portolan graph extraction. The constitution's "complement, do not replace" principle is respected.

**Severity**: pass

---

### 4. Requirements fit — verified with open dependency

FR-001 through FR-005 are addressed by the producer decision record, availability ledger, and claim boundary classification. SC-001 (decision record) and SC-003 (claim rejection without resolved evidence) are met. SC-002 (produced graph output tied to command evidence) is met by the negative case: no graph output was produced, and the absence is documented.

**Severity**: pass

---

### 5. Product-boundary fit — verified

The slice owns the gap created by spec 075 without overreaching into spec 076 parity territory. Dependencies on 074 and 076 are preserved as open.

**Severity**: pass

---

### 6. Test/verification gaps — minor finding

The plan lists `go test ./...`, `go vet ./...`, `jq empty schema/*.json`, and `git diff --check` as verification commands, then states "no additional Go tests are required beyond baseline" for docs-only closure. The tasks.md does not include a T-slot for running these baseline commands; T016 is listed but not completed. This is a process completeness gap, not a content defect.

**Severity**: minor

**Evidence**: `tasks.md` T016 unchecked; `plan.md` verification section lists baseline commands but no evidence of execution in the packet.

**Recommendation**: Run baseline checks during T016 closeout and record pass/fail in the PR readiness closeout.

---

### 7. Stress/verification gaps — open by design

T014 (three independent non-GPT review lanes) and T015 (record disposition) are open. The backlog and plan explicitly expect these to be open at this point. The Cursor stress (T013) is complete and consistent with the decision record.

**Severity**: not_assessed (expected open)

---

### 8. Full symbol/reference/callgraph claims — cannot_verify, correctly preserved

The packet does not claim full graph closure. The decision record, availability ledger, and cursor stress output all confirm `cannot_verify` for full C6 and callgraph. No partial evidence is stacked into a parity claim.

**Severity**: pass

---

### 9. Producer decision record completeness — minor finding

The decision record compares eight producer families and four rejected alternatives. However, the "Source Notes" section cites documentation descriptions (e.g., "Sourcegraph documentation describes SCIP/LSIF indexing as code-navigation index output") without linking to the specific source or quoting the relevant passage. For a decision record that may be cited by future slices, the provenance could be stronger.

**Severity**: minor

**Evidence**: `reviews/graph-producer-decision-record-2026-06-02.md` "Source Notes" section.

**Recommendation**: Add URLs or document paths for the cited tool documentation in the decision record, or note that the claims are based on general tool knowledge rather than specific citations.

---

## Not Assessed

| Item | Reason |
| --- | --- |
| Spec 074 runtime health execution | Outside 077 scope; approval-gated |
| Spec 076 Cursor enterprise parity | Outside 077 scope; not run |
| T014–T015 independent review lanes | Expected open per backlog; completing now would be premature |
| T016–T019 closeout | Not yet executed |
| Actual graph output from unavailable producers | No producer was installed or run; absence correctly recorded |

## Verdict

**APPROVE with two minor findings.** The packet is evidence-state honest, local-first safe, and correctly preserves `cannot_verify` for the claims it cannot support. The minor findings are process completeness items (baseline check execution, source note provenance) that do not block the decision record or claim boundaries. No critical or major issues found.
