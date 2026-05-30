# Pages Publishing Decision

**Date**: 2026-05-31

## Decision

Add a GitHub Actions Pages workflow at `.github/workflows/pages.yml` that uploads `docs/site/` as a static artifact and deploys it with GitHub Pages.

## Rejected Alternatives

- Branch/path Pages publishing: simpler in GitHub UI, but less reviewable in repository code and harder to validate in PR.
- Static site generator build: unnecessary for two static pages.
- External hosting: out of scope for local-first OSS launch.

## Why Now

The workflow makes the publishing source explicit in version control and keeps deployment separate from Portolan CLI behavior.

## Reversibility

High. The workflow can be replaced by branch/path publishing or a separate Pages repository later.

## Risk If Wrong

GitHub Pages may require repository settings that are not enabled yet. That state will be recorded as `not_assessed` or `blocked` until GitHub reports deployment evidence.

## Confidence

medium
