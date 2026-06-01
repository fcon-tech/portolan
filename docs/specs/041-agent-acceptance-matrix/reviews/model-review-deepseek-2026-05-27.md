# Portolan Spec 041 Implementation Diff Review

## Findings

### F1 – Product claim wording overstates current evidence

| Field        | Value |
|--------------|-------|
| **Severity** | Minor |
| **Evidence** | `docs/product-claims.md` adds a row: *“Portolan can support blind acceptance runs across multiple agent harnesses and target shapes.”* The safe wording correctly limits this to “The matrix contract exists, but only the Codex single-repo self-target lane is verified …” However the claim statement itself asserts a **capability** that no evidence in the diff substantiates — only one lane was run, and even that lane was a self‑target of the Portolan repository. |
| **Recommendation** | Rephrase the claim to match the evidence, e.g. *“Portolan defines an acceptance matrix contract for blind acceptance runs”* or *“Portolan has a documented acceptance matrix for blind acceptance runs.”* This removes the implication of proven multi‑harness support. |
| **Verdict** | **Actionable.** The claim can be tightened without limiting future lanes. |

No other actionable issues were found. All other areas — requirements fit, product boundary, security/privacy, and evidence‑state honesty — are met by the diff.

## Verdict

The implementation diff honours the requirements of spec 041:

- The acceptance matrix, blind prompt, and lane ledger are documented and consistent.
- The product boundary is respected: Portolan remains a local, read‑only evidence‑preparation layer; no network access, mutation, or external service is introduced.
- Security and privacy are maintained: no credentials, cloning, or hidden scaffolding is used; the prompt is self‑contained and local‑only.
- Evidence‑state honesty is strong: every lane is correctly marked, the self‑target nature of the Codex run is explicitly disclosed, the self‑scored status is flagged, and the unexercised `cannot_verify` path is explicitly noted.
- The only actionable issue is the wording of the product claim noted above.

## Not Assessed

The following are explicitly recognised in the diff as **not assessed** and cannot be considered validated:

- **Target shapes**: multi‑repo and black‑box/metadata‑heavy
- **Harnesses**: Cursor UI/Composer, OpenCode
- **External repositories**: any single‑repo target other than the Portolan self‑target
- **Runtime topology, lifecycle modelling, non‑Go relationship detection, code‑index, Semgrep, CycloneDX, OpenAPI, AsyncAPI, Structurizr, Backstage outputs** — all flagged as `not_assessed` in the lane ledger or context gaps
- **`cannot_verify` scoring path** — unexercised by the only completed lane

These gaps are properly surfaced; no attempt is made to collapse them into a pass/fail judgement.
