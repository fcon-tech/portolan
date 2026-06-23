# Product Claims

This page is the current public claim boundary for Portolan. It follows the
captain-atlas contract in `docs/captain-atlas/`.

## Current Safe Wording

Portolan is a local-first atlas generator for AI agents. A captain gives an
agent a Portolan link plus a target software ecosystem; the agent installs or
prepares Portolan, builds a local atlas bundle, opens a generated atlas app, and
uses that bundle to explain visible repos, components, relationships, risks,
and gaps.

This is the product direction and acceptance target. It is not a claim that
every harness, target shape, or customer estate already works.

## Claim Boundary

| Claim | Status | Safe wording |
| --- | --- | --- |
| Portolan targets the captain-atlas scenario. | `accepted` | Safe: the active product specs define this as the product contract. |
| Portolan generates local atlas data and a local viewer from visible files and supplied local artifacts. | `narrowed` | Safe for the implemented install/scan/viewer path; usefulness still depends on target shape and available producers. |
| Portolan should help Cursor Composer build an atlas from a Portolan link and target path. | `target` | This is the first acceptance client, not yet a broad product guarantee. |
| Portolan replaces Cursor, Sourcegraph, Backstage, Understand Anything, or code intelligence products. | `rejected` | Safe wording: Portolan complements agents and may wrap OSS/product outputs when they win. |
| Portolan proves complete enterprise architecture or runtime topology from source alone. | `rejected` | Safe wording: Portolan shows visible local scope and marks gaps. |
| Portolan's evidence states are the main value proposition. | `rejected` | Evidence states are guardrails. The user-facing value is a useful atlas. |
| Portolan should build a capability when existing OSS already solves it. | `rejected` | The OSS kill-gate spec decides kill, pack, or build per capability. |

## Required Limits

- Do not claim arbitrary Cursor UI behavior until the Cursor Composer first-run
  BDD passes.
- Do not claim complete estate coverage from local repository count alone.
- Do not claim runtime topology unless runtime observations were supplied or
  captured with explicit approval.
- Do not treat missing, failed, partial, or stale producer output as a clean
  result.
- Do not claim broad security certification. Portolan is local-first and
  read-only by default, but each new surface still needs review.
- Do not present LLM-authored conclusions as source truth.

## How To Use This Page

- Product copy may use `accepted` and properly scoped `narrowed` claims.
- `target` claims describe the desired product and must not be written as
  already proven.
- `rejected`, `failed`, `blocked`, and `not_assessed` states are limits, not
  positive claims.
- When in doubt, route the decision through `docs/captain-atlas/06-oss-kill-gates.md`.
