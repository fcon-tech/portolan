# Security Contact Options

**Date**: 2026-05-30

## Recommendation

Use GitHub private vulnerability reporting as the primary public security
channel for `fcon-tech/portolan`. The maintainer accepted this recommendation.

Do not publish `security@fcon.tech` for v1 unless the alias exists, is
monitored, and has a named owner. Do not publish a personal maintainer email as
the first public security contact.

## Why

- GitHub private vulnerability reporting keeps sensitive reports out of public
  issues and discussions.
- It avoids publishing personal contact data.
- It matches GitHub's public-repository security advisory workflow.
- It can be paired with `SECURITY.md` so the community profile is complete.

## Remaining Decisions

- `blocked`: Repository admin must enable or reject private vulnerability
  reporting for `fcon-tech/portolan`.
- `blocked`: Maintainer must approve conduct policy choice separately.

## SECURITY.md Draft Policy Shape

```text
Supported versions:
- v0.1.x after release.
- main is best-effort until a tagged release exists.

Reporting:
- Prefer GitHub "Report a vulnerability" for this repository.
- If unavailable, do not publish sensitive details publicly; the repository
  should record private reporting as blocked until GitHub reporting is enabled.
- Do not open public issues with sensitive vulnerability details.

Scope:
- Portolan is a local CLI and does not claim broad security certification.
```
