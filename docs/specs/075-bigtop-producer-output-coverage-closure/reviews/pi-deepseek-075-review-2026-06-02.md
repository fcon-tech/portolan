## Spec 075 Portolan Review — Producer Coverage Closure

### Finding 1 — Matrix self-assesses but lacks explicit evidence trace per spec
- **Severity**: major
- **Evidence**: The matrix covers specs 054–074 but describes producer outputs with bounded/partial qualifiers (“partial gopls symbol listings,” “bounded jscpd clone report”) without linking to concrete artifacts, file paths, or output samples that a reviewer could independently validate. The active memory states “Matrix verified bounded producer outputs” but does not show what verification consisted of.
- **Recommendation**: For each bounded/partial entry, add a brief artifact reference (e.g., file path, command invocation, output excerpt) so that “verified” carries a verifiable trace, not a self-attestation. This is especially important for entries crossing tool boundaries (Ctags, gopls, jdeps) where interpretation matters.

### Finding 2 — “cannot_verify” classification conflates three distinct blocking conditions
- **Severity**: major
- **Evidence**: The matrix collapses three distinct blockers — explicit approval pending (spec 074 runtime health run), tool capability limits (Ctags reference-role vs. full graph, gopls selected-file vs. project-wide), and external dependency (spec 076 paired Cursor validation) — under a single “cannot_verify” label. These have different resolutions: one is a gate decision, one is a producer architecture limitation, and one is a process dependency on a future spec.
- **Recommendation**: Split “cannot_verify” into distinct statuses: `blocked_awaiting_approval`, `blocked_producer_scope`, and `blocked_future_spec`. This clarifies what is permanently out of scope vs. merely deferred.

### Finding 3 — Producer completeness: seed families partially mapped, gaps visible
- **Severity**: major
- **Evidence**: The stated seed families from the objective are “symbol/API/catalog/model/runtime.” The matrix covers: model (Docker Compose, Helm — desired-state), catalog (protobuf descriptors — limited), runtime (partial lifecycle/NodeManager evidence from spec 073), symbol (Ctags, gopls — partial), and API (jdeps — narrow). Missing or under-covered: no evidence of real API surface extraction (Swagger/OpenAPI, gRPC reflection, GraphQL introspection), no catalog output beyond protobuf (no package registry dumps, no SBOM variant beyond Syft/CycloneDX), and model coverage is static-manifest only, not behavioral or state-machine models.
- **Recommendation**: Add a “gaps acknowledged” section enumerating uncovered seed-family subcategories and state whether they are in roadmap, permanently out of scope, or awaiting discovery. This prevents overclaim on “beyond Syft/CycloneDX” when coverage is narrower than the objective implies.

### Finding 4 — Overclaim risk in “verified” for bounded entries
- **Severity**: minor
- **Evidence**: The active memory says “Matrix verified bounded producer outputs.” For entries like Semgrep local-rule findings, the scope is inherently local — it depends on which rules are installed and which files are in scope. “Verified” could be read as asserting completeness, which bounded outputs cannot provide. Cursor Composer 2.5 stress “preserved the same boundaries” does not constitute stress-testing of semantic correctness.
- **Recommendation**: Change “verified” to “confirmed bounded output shape” or similar, and note that correctness of content is not assessed. This tightens the evidence-state semantics without weakening the matrix’s value.

### Finding 5 — Spec 076 dependency is declared but acceptance criteria are absent
- **Severity**: minor
- **Evidence**: “Human/enterprise parity” is deferred to spec 076 paired Cursor validation, but spec 075 does not define what spec 076 must deliver for this entry to flip from “cannot_verify” to verified. Without exit criteria, the dependency is an open-ended deferral.
- **Recommendation**: Add a one-line acceptance criterion for spec 076 in the matrix row — e.g., “spec 076 must provide side-by-side Cursor+Portolan output comparison for at least one representative topology.”

### Finding 6 — No explicit PR readiness checklist
- **Severity**: minor
- **Evidence**: The spec claims “No Portolan code change and no target mutation,” which simplifies review, but there is no checklist confirming branch hygiene (rebase state, commit message format, any stray artifacts). For a closure/assessment spec, the review surface is the matrix content itself, but the PR description is not assessed here.
- **Recommendation**: Before PR, confirm the branch contains only the matrix addition, has a descriptive commit message referencing spec 075, and passes any existing lint/doc checks.

---

**Verdict**: Approve with conditions. The matrix provides a useful bounded self-assessment of producer coverage across specs 054–074. The primary risks are (1) lack of evidence trace for “verified” entries, (2) conflation of distinct blocking conditions under “cannot_verify,” and (3) acknowledged but unenumerated gaps in seed-family coverage. These are correctable without changing the matrix’s conclusions.

**Not assessed**: Correctness of individual tool outputs (Ctags, gopls, jdeps, Semgrep, etc.), Cursor Composer 2.5 stress methodology, spec 074 runtime health gate decision rationale, and spec 076 design.
