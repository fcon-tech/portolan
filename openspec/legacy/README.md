# Legacy specification surface (pre-OpenSpec)

This directory is the **verbatim** copy of the former `docs/captain-atlas/`
specification surface, retained for history. It is **not** the active
specification authority.

## Where the authority now lives

The active source of truth is **`openspec/specs/`** — OpenSpec-format living
specs (Purpose + Requirements + Scenarios, RFC 2119). The product behavior
defined in the captain-atlas charter (`captain-atlas/08-portolan-product-charter.md`)
and the behavior-defining work packages (09, 15, 16, 17) has been migrated
into these OpenSpec specs:

| OpenSpec spec (living) | Migrated from |
| --- | --- |
| `specs/atlas-identity/` | charter 08 § Product Identity, Roles, Part 1/2 Boundary |
| `specs/intake/` | charter 08 § Intake Model |
| `specs/ontology/` | charter 08 § Ontology |
| `specs/confidence/` | charter 08 § Trust Contract |
| `specs/navigation/` | charter 08 § Navigation Model |
| `specs/three-truths/` | charter 08 § The Three Truths |
| `specs/ux-principles/` | charter 08 § UX Principles |
| `specs/visual-style/` | `09-portolan-visual-style-specification.md` |
| `specs/reading-experience/` | `15-atlas-reading-experience.md` |
| `specs/drilldown-semantics/` | `16-atlas-drilldown-decision-semantics.md` |
| `specs/semantic-investigation/` | `17-semantic-component-investigation-contract.md` |

## What was NOT converted and why

The remaining captain-atlas documents were **not** migrated into spec format
because they are not behavioral specs — converting them would distort them:

- **Work-package supporting notes** (`00`–`06`): scorecards, claim boundaries,
  first-run notes, producer matrices, kill/pack/build scorecards. Process
  material, subordinate to the charter.
- **Frozen 0.1.0 contract** (`07-portolan-core-product-spec.md`): the historical
  system-map schema/builder/viewer contract. Its concepts are superseded by the
  charter (see its own "Superseded Concepts" table); it is retained verbatim as
  the frozen-contract reference, removed by the 0.2.0 big-bang migration.
- **Roadmap / research / review** (`10`, `11`, `12`, `13`, `14`, `agent-qa-rubric`,
  `bdd-feature-report`, `cold-reader-check`, `implementation-checklist`,
  `network-install-approval`, scorecards): planning, research-control, and
  review artifacts — not product behavior.

These are kept here verbatim so no knowledge is lost. Treat this directory as
read-only history. New spec work happens via the OpenSpec workflow
(`/opsx:propose`, `openspec/changes/`).
