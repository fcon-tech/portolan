## 074 Branch Review — Independent Portolan Reviewer

### findings

**F1 — Objective scope drift toward "health checks"** [major]
Spec 074 reframes the unbounded runtime‑topology capture (073's cannot_verify) into a *health‑oriented* subset: service‑health, daemon logs, HDFS/YARN/MapReduce smoke probes, cleanup. The full symbol/reference graph, call graph, and enterprise parity originally required for "architecture parity" are deferred to backlog‑only specs 075/076 with no execution‑plan date. This shrinks the objective — the branch will close 074 as "verified" while leaving the core parity ask unscheduled.
- **Evidence:** branch structure shows 074 active, 075/076 backlog‑only.
- **Recommendation:** Either rename 074 to "Runtime Health Capture" (truthful scope) or keep the original "Topology / Architecture Parity" label and leave 074 as a prerequisite, not the closure condition.

**F2 — blocked / cannot_verify semantics are correct, but carry unresolved circular dependency** [major]
The state file records *blocked for runtime execution* and *cannot_verify for topology completeness*. The approval gate requires a fresh Cursor+Portolan run with Docker create/exec/smoke/destroy. But that run itself is what would move state from cannot_verify to verified — the gate cannot be resolved without human approval, and the human cannot approve without seeing evidence that the gate *would* resolve. This is a classic evidence‑deadlock.
- **Recommendation:** Add an explicit pre‑flight dry‑run or audit‑log replay path so the reviewer can assess safety without a live container‑creation cycle.

**F3 — SpecKit readiness: no runtime‑evidence attachment strategy** [major]
No output directory conventions, log‑retention rules, or artifact‑hash manifests are specified for the Docker create/exec smoke sequence. Without these, a future reviewer cannot distinguish a successful gate‑pass from a hand‑written approval message.
- **Recommendation:** Define required artifacts (e.g., `evidence/074/container‑ids.txt`, `evidence/074/smoke‑*.log`, sha256sum manifest) and require the approval to reference them.

**F4 — No Portolan code change is acceptable** [minor — confirmatory]
The branch is purely spec/approval planning. This is correct and does not itself introduce regressions. However, the absence of any instrumentation hook means the approval must be entirely human‑driven — no automated safety‑check script is provided.

### severity
- **F1:** major (objective shrink without explicit scope‑change justification)
- **F2:** major (approval stalemate)
- **F3:** major (non‑reproducible evidence)
- **F4:** minor (correct, but increases human‑review burden)

### evidence
- Branch 074 contains active spec 074; specs 075 and 076 are backlog‑only.
- Approval‑state file uses "blocked" for runtime and "cannot_verify" for topology, consistent with Portolan lexicon.
- No artifact‑manifest, output‑directory definition, or replay‑log path found.

### recommendation
1. Scope‑change acknowledgment: state explicitly that 074 covers health‑oriented subset and full topology parity remains open (075/076).
2. Evidence‑deadlock resolution: add a dry‑run or audit‑replay check as a lighter‑weight approval trigger.
3. Artifact contract: specify mandatory output files and a hash manifest so the gate is auditably passed.
4. After 1‑3, the branch can go to PR; the approval gate must be exercised in a subsequent PR or run.

### verdict
**NOT READY** — merge‑blocked until scope‑change acknowledgment and evidence‑deadlock resolution are committed.

### not_assessed
- Actual Docker runtime safety of the planned create/exec/smoke/destroy commands (no implementation to review).
- Specs 075/076 content (backlog‑only, out of scope for this review).
