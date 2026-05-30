# Maintainer Decisions: Canonical Public Install And Release

**Date**: 2026-05-30

## Decisions

- `verified`: Maintainer chose `github.com/fcon-tech/portolan` as the
  canonical public identity.
- `verified`: Maintainer chose `v0.1.0` as the first public release version.
- `verified`: Maintainer requested safe and stylish release presentation; this
  spec interprets that as restrained, evidence-forward technical launch copy.
- `verified`: First release artifact policy is source-first; prebuilt binaries
  are deferred unless explicitly added with platform smoke and checksum
  coverage.
- `not_assessed`: GitHub release publication state.
- `not_assessed`: GitHub check state for the future release.

## Release Copy Recommendation

Use a concise GitHub release note with five sections:

1. What Portolan is.
2. Quick start.
3. What is verified.
4. Apache Bigtop demo.
5. Known limits.

This is safer than a marketing-style launch page because it keeps current
evidence boundaries visible while still giving outsiders a polished first
reading path.
