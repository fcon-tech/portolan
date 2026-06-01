# Quickstart: Product Claim Gate

## 1. Reconstruct Inputs

Review these local sources:

```bash
sed -n '1,220p' docs/mvp.md
sed -n '1,220p' docs/product-boundary.md
sed -n '1,160p' docs/product-backlog.md
find docs/specs/034-cursor-comparison-validation docs/specs/035-oss-producer-acceptance docs/specs/036-scope-completeness-validation docs/specs/037-relationship-evidence-taxonomy -maxdepth 3 -type f | sort
```

## 2. Build The Claim Ledger

Create `docs/specs/038-product-claim-gate/reviews/product-claim-ledger-YYYY-MM-DD.md`
from current product claims and classify each one as `accepted`, `narrowed`,
`rejected`, `not_assessed`, `blocked`, or `failed`.

Rules:

- Accepted and narrowed claims require local evidence links.
- Internal implementation status is not enough for product-ready claims.
- UI Cursor/Composer, runtime topology, near-clone/SBOM duplication, and full
  ecosystem completeness must remain limited unless directly validated.

## 3. Generate The Client-Safe Answer

Create `docs/specs/038-product-claim-gate/reviews/client-safe-answer-YYYY-MM-DD.md`.
Use only accepted or narrowed claims and carry material limitations forward.

## 4. Verify

Run:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
```

For this documentation-first slice, also inspect the ledger and answer against
`contracts/product-claim-ledger.md`.

## 5. Close Out

Update:

- `docs/specs/038-product-claim-gate/tasks.md`
- `docs/specs/038-product-claim-gate/spec.md`
- `docs/product-backlog.md`
- review dispositions under `docs/specs/038-product-claim-gate/reviews/`

Only claim a ready-for-review PR after PR review evidence and readiness
closeout are recorded.
