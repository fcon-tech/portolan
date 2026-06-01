# Pages Domain Decision

**Date**: 2026-05-31

## Decision

Use the default GitHub Pages URL for v1. Do not add a `CNAME` file or custom-domain configuration in this PR.

## Evidence Labels

- Custom domain ownership: not_assessed.
- DNS state: not_assessed.
- HTTPS state for custom domain: not_assessed.
- Default Pages URL: not_assessed until the workflow deploys on GitHub.

## Rejected Alternatives

- Configure `fcon.tech` now: blocked because DNS/domain verification was not available in this local implementation session.
- Configure `portolan.fcon.tech` now: same blocker.

## Why Now

Default GitHub Pages keeps the first public site static and credential-free while avoiding unverifiable domain claims.

## Reversibility

High. A future PR can add `CNAME` after domain ownership, DNS, and HTTPS are verified.

## Risk If Wrong

Launch polish is lower until the custom domain is configured.

## Confidence

medium
