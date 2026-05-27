# Research: Release Envelope

## Decision: Add GitHub Actions CI Before More Product Claims

Rationale: PR closeouts currently preserve absent checks as `not_assessed`. That is honest, but it prevents Portolan from being externally product-ready. A small CI workflow gives maintainers a current verification surface without changing runtime behavior.

Alternatives considered:

- Rely on local verification only. Rejected because external PR readiness remains unverifiable.
- Add a broad large-corpus CI run. Rejected because it would be slow, environment-sensitive, and unnecessary for every PR.

## Decision: Keep Source Bootstrap As The First Install Path

Rationale: The repo already has `scripts/bootstrap-portolan` and no package distribution. Hardening that path is faster and safer than adding package-manager releases.

Alternatives considered:

- Publish package-manager installers first. Rejected because versioned CI and artifact discipline are prerequisites.
- Require `go run`. Rejected because agents need a stable binary path.

## Decision: Release Notes Must Reference Product Claims

Rationale: The product boundary is intentionally narrow. Release publication must not drift from `docs/product-claims.md`.

Alternatives considered:

- Maintain separate release claim wording. Rejected because it creates a second truth source.
