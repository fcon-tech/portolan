# Spec Package Self-Review: Canonical Public Install And Release

**Date**: 2026-05-30

## Assessment

- `verified`: The repository currently has `go.mod` declaring
  `github.com/fall-out-bug/portolan`.
- `verified`: README and Russian README currently use
  `https://github.com/fall-out-bug/portolan.git`.
- `verified`: Release docs currently use the `github.com/fall-out-bug/portolan`
  ldflags package path.
- `not_assessed`: Public GitHub release state.
- `not_assessed`: Public GitHub checks for this future release.
- `not_assessed`: Current GitHub topics/homepage/community profile.

## Findings

1. **major - Canonical identity remains a product decision**
   - The spec correctly blocks implementation until maintainers choose the
     public identity. Without that decision, implementation would risk making
     public install copy worse.

2. **minor - Release automation is deliberately deferred**
   - This is acceptable because manual release credibility is the smaller first
     move. A GoReleaser follow-up can be added after the first public path works.

## Open Questions

- Should the canonical public path be `github.com/fcon-tech/portolan`?
- If prebuilt binaries are added later, which platforms and signing/checksum
  expectations are required?
- Should release notes be written as a GitHub release body, `CHANGELOG.md`, or
  both?
