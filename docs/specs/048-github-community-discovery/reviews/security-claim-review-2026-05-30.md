# Security Claim Review

**Date**: 2026-05-30

## Scope

Review `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`,
`CODE_OF_CONDUCT.md`, `README.md`, and `docs/product-claims.md` for security
claim drift.

## Findings

| Surface | State | Evidence |
| --- | --- | --- |
| Private vulnerability reporting route | `verified` | `gh api repos/fcon-tech/portolan/private-vulnerability-reporting` returned `{"enabled":true}`. |
| Public vulnerability instructions | `verified` | `SECURITY.md` points to `https://github.com/fcon-tech/portolan/security/advisories/new` and tells reporters not to publish sensitive details publicly. |
| Fallback email | `verified` | Absence verified: `SECURITY.md` explicitly states no public PGP key or fallback security email is published for v1. |
| Security certification claim | `verified` | Absence verified: public claim scan hits only limiting language such as "does not claim broad security certification". |
| Support SLA claim | `verified` | Absence verified: `SECURITY.md` and `SUPPORT.md` state best-effort/no public SLA only. |
| Conduct policy | `verified` | `CODE_OF_CONDUCT.md` is present and avoids inventing a private conduct mailbox. |

## Disposition

Security wording is aligned with `docs/product-claims.md`. No broad security
certification, SLA, sandboxing, or hardening claim was introduced.
