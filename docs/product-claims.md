# Product Claims

This page is the repo-level claim boundary for Portolan. Start here before
writing README copy, a client answer, a proposal, a demo script, or an agent
instruction that says what Portolan can do.

Detailed evidence and review records live under
`specs/038-product-claim-gate/reviews/`. This page is the maintained product
surface derived from that evidence.

## Current Client-Safe Answer

Portolan is useful when an agent needs a bounded local evidence pack before it
answers architecture or estate questions.

In the fixed local Bigtop headless Cursor comparison, the Portolan-assisted
lane reduced unsupported claims from 12 to 0 and produced equal or better next
actions across all five tested questions.

The practical value is evidence discipline. Portolan prepares local context,
map, graph, finding, and answer-contract artifacts that tell an agent what is
visible, what is only declared, what is missing, and what remains unknown. That
makes an agent less likely to turn local files, partial scans, or planned OSS
integrations into broader claims.

The current validated claim is narrow. Portolan supports local visible-scope
mapping, exact duplicate-cluster evidence, relationship evidence by type, and
Syft/CycloneDX component identity evidence where those artifacts exist.
Portolan should be described as a complement to Cursor and enterprise tools,
not as their replacement.

## Claim Boundary

| Claim | Status | Safe wording |
| --- | --- | --- |
| Portolan helps an agent answer CTO-level questions with fewer unsupported claims than Cursor alone. | `narrowed` | Proven for the fixed local Bigtop headless Cursor comparison. Do not generalize to UI Cursor/Composer. |
| Portolan provides a local, read-only context pack and optional evidence-backed map before agents answer. | `accepted` | Safe as a capability claim for the current CLI and artifact workflow. |
| Portolan understands a complete inherited software estate from a local target. | `rejected` | Say local visible scope unless a supplied inventory verifies completeness. |
| Portolan can provide full runtime service topology. | `not_assessed` | Runtime topology requires local runtime observations; otherwise it remains unassessed. |
| Portolan composes existing OSS tool outputs instead of reimplementing mature scanners. | `narrowed` | Safe for Syft/CycloneDX component identity on the fixed Bigtop target and bounded jscpd JSON ingestion on the Portolan repository smoke target. Semgrep remains unassessed. |
| Portolan detects duplication across a landscape. | `narrowed` | Safe for native exact source/config duplicate clusters and bounded jscpd near-clone evidence only for the named target/profile that produced usable JSON. Bigtop near-clone and SBOM duplicate risk remain unproven. |
| Portolan detects relationships across imports, manifests, metadata, runtime exports, and claims. | `narrowed` | Safe only when the relationship evidence type is named. Runtime-visible relationships require runtime evidence. |
| Portolan replaces Cursor, coding harnesses, enterprise code intelligence, service catalogs, observability, modernization, or readiness tools. | `rejected` | Say Portolan is a local discovery and evidence-preparation complement. |
| Portolan can safely support claims about UI Cursor/Composer behavior. | `not_assessed` | Use headless Cursor comparison wording until UI Cursor/Composer is validated. |

## Limits That Must Stay Visible

- Portolan is a local evidence-preparation tool, not a live service, SLA,
  observability system, modernization engine, or control plane.
- UI Cursor/Composer behavior is `not_assessed`; the comparison evidence is for
  headless Cursor on the fixed local Bigtop target.
- Complete inherited-estate coverage is not proven by repository count.
- Runtime service topology remains `not_assessed` without runtime observations.
- OSS producer validation is narrow: Syft/CycloneDX component identity is
  verified for the fixed target, bounded jscpd JSON ingestion is verified on
  the Portolan repository smoke target, the full Bigtop near-clone run remains
  unproven, and Semgrep remains `not_assessed`.
- Output quality depends on the local evidence supplied to Portolan. Missing,
  stale, or incomplete inputs must stay visible as gaps, not be hidden as
  product success.

## Evidence

- Claim ledger:
  `specs/038-product-claim-gate/reviews/product-claim-ledger-2026-05-27.md`
- Client-safe answer source:
  `specs/038-product-claim-gate/reviews/client-safe-answer-2026-05-27.md`
- Cursor comparison validation:
  `specs/034-cursor-comparison-validation/reviews/implementation-disposition-2026-05-26.md`
- OSS producer acceptance:
  `specs/035-oss-producer-acceptance/reviews/implementation-disposition-2026-05-26.md`
- Scope completeness validation:
  `specs/036-scope-completeness-validation/reviews/pr16-merge-closeout-2026-05-27.md`
- Relationship evidence taxonomy:
  `specs/037-relationship-evidence-taxonomy/reviews/merge-closeout-2026-05-27.md`
- Bounded jscpd profile:
  `specs/039-bounded-jscpd-profile/reviews/implementation-disposition-2026-05-27.md`

## How To Use This Page

- Product copy may use only `accepted` or `narrowed` claims.
- A `narrowed` claim must carry its scope in the same paragraph.
- `rejected`, `not_assessed`, `blocked`, and `failed` claims are limitations,
  not positive claims.
- Internal tests and implementation status can support capability readiness,
  but they are not enough to claim product value.
