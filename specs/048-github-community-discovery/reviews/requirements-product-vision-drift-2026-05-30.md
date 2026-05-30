# Requirements And Product Vision Drift Review

**Date**: 2026-05-30

## Scope

Review `spec.md`, `plan.md`, `tasks.md`, `contracts/`, `research.md`,
`README.md`, `docs/onboarding.md`, and `docs/product-claims.md` before
implementing the GitHub community discovery slice.

## Decision Gate

- Simpler/Faster: Use standard GitHub community files and repository metadata.
  Do not add a custom portal, automation, badge program, or docs site in this
  slice.
- Blocking Edge Cases: Security contact must be real; conduct policy must be
  maintainer-approved; GitHub settings are external state and cannot be marked
  verified without inspection.
- Existing Open Source: GitHub community files, issue forms, pull request
  templates, and private vulnerability reporting solve this well enough.

## Requirements Drift

| Surface | Assessment |
| --- | --- |
| Backlog row | Aligned with 048 scope: public GitHub visitors and contributors need contribution, security, and OSS-health routes. |
| `spec.md` | Aligned after maintainer decisions: GitHub private vulnerability reporting, conduct policy, and metadata direction are accepted. |
| `tasks.md` | Concrete and file-scoped. T005-T007 are now unblocked or externally verifiable. |
| Contracts | Community file and metadata contracts preserve support, security, and claim boundaries. |
| Existing docs | README and onboarding already expose install, product claims, and agent docs; they need community/security route links. |

## Product Vision Drift

| Product rule | Assessment |
| --- | --- |
| Local-first/read-only default | Aligned. Community docs do not change CLI behavior. |
| No unsupported product category | Aligned. Topics exclude observability, service catalog, readiness, modernization, and security-scanner. |
| Evidence-state honesty | Aligned. Templates require `verified`, `failed`, `blocked`, `unknown`, `cannot_verify`, and `not_assessed`. |
| Security boundary | Aligned. `SECURITY.md` must point to GitHub private vulnerability reporting and avoid broad certification claims. |
| OSS composition posture | Aligned. No new dependencies are added. |

## Disposition

No implementation blocker remains for repo-local community files.

External GitHub metadata and community profile states must be recorded as
`verified`, `blocked`, or `not_assessed` in closeout artifacts.
