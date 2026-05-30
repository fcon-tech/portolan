# Security Policy

This policy was last reviewed on 2026-05-30.

## Supported Versions

| Version | Support |
| --- | --- |
| No tagged release yet | Best-effort only. |
| `v0.1.x` | Supported after the first `v0.1.0` release is published. |
| `main` | Best-effort until a tagged release exists. |

## Reporting A Vulnerability

Use GitHub private vulnerability reporting for `fcon-tech/portolan`:

```text
https://github.com/fcon-tech/portolan/security/advisories/new
```

From the repository page, open **Security** and choose **Report a
vulnerability**. Do not include sensitive vulnerability details in public issues,
pull requests, or discussions.

If the private report flow is unavailable, do not publish the sensitive details
publicly. Open a public issue only with a non-sensitive summary saying that the
private vulnerability reporting path is unavailable.

No public PGP key or fallback security email is published for v1.

## Response Expectations

Maintainers handle security reports on a best-effort basis. Portolan does not
currently publish a public security SLA.

When a report is accepted, maintainers will try to:

1. acknowledge the report;
2. determine whether the issue affects the supported release or `main`;
3. record the state as `verified`, `failed`, `blocked`, or `not_assessed`;
4. fix, narrow, reject, or document the finding.

## Security Claim Boundary

Portolan is a local CLI and does not claim broad security certification,
sandboxing, exploit detection, or hardening. Current security wording is limited
to documented local CLI boundaries and focused tests described in
[Product Claims](docs/product-claims.md) and
[Security Threat Model](docs/security-threat-model.md).
