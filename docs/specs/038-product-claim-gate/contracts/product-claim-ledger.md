# Contract: Product Claim Ledger

The product claim gate produces two review artifacts under
`docs/specs/038-product-claim-gate/reviews/`:

- `product-claim-ledger-YYYY-MM-DD.md`
- `client-safe-answer-YYYY-MM-DD.md`

## Ledger Required Sections

1. Scope and evidence sources.
2. Claim records.
3. Status summary.
4. Backlog actions.
5. Limitations that must appear in external language.

## Claim Record Shape

Each claim record must be representable as JSONL using this shape:

```json
{
  "id": "C001",
  "claim": "Portolan helps an agent answer CTO questions with fewer unsupported claims than Cursor alone.",
  "claim_type": "comparison",
  "source": "docs/mvp.md",
  "target_scope": "headless Cursor Agent on fixed local Bigtop comparison",
  "status": "narrowed",
  "decision": "Accepted only for the validated headless comparison scope.",
  "evidence_links": [
    {
      "path": "docs/specs/034-cursor-comparison-validation/reviews/implementation-disposition-2026-05-26.md",
      "evidence_state": "verified",
      "summary": "Records accepted evidence discipline improvement on fixed local Bigtop comparison."
    }
  ],
  "limitations": [
    "UI Cursor/Composer remains not_assessed.",
    "Full inherited-estate completeness remains not_assessed outside validated scope."
  ],
  "backlog_action": "none"
}
```

## Status Rules

- `accepted`: Evidence supports the claim as written for the stated scope.
- `narrowed`: Evidence supports a smaller claim; client-safe language must use
  the narrower wording.
- `rejected`: Evidence contradicts the claim or the claim is outside Portolan's
  boundary.
- `not_assessed`: No usable validation evidence exists.
- `blocked`: Validation could not run because a named prerequisite is missing.
- `failed`: Validation ran and did not support the claim.

## Client-Safe Answer Rules

- Positive claims may use only `accepted` or `narrowed` records.
- The answer must include a limitations section when any material comparison,
  runtime, OSS producer, UI, or completeness claim is `not_assessed`, `blocked`,
  or `failed`.
- The answer must not describe Portolan as a readiness gate, replacement for
  enterprise tooling, or proof source for claims it cannot verify.
