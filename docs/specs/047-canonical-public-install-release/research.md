# Research: Canonical Public Install And Release

## Decision Gate

### Simpler/Faster

Use the existing Go CLI release envelope, README, and release checklist. Do not
add a landing page, package manager, Docker image, or release automation until
the canonical public identity is settled and a manual release can be verified.

### Blocking Edge Cases

- Current public repository naming can diverge from the module path.
- Release ldflags currently depend on the module import path.
- GitHub release publication and GitHub check state are external surfaces and
  must be reported as `not_assessed` unless checked.
- Product copy can accidentally broaden Bigtop, Cursor, OpenCode, OSS adapter,
  or security claims beyond `docs/product-claims.md`.

### Existing Open Source

- Go's native module, build, and `go install` workflow is the smallest first
  release path.
- GitHub Releases and generated checksums are sufficient for a first public
  artifact.
- GoReleaser is a plausible future option, but it adds configuration,
  dependency, and CI complexity before the canonical identity issue is solved.

## Decisions

### D-001 - Canonical public identity is fcon-tech/portolan

**Decision**: Use `github.com/fcon-tech/portolan` as the canonical public
repository/module/install identity for launch.

**Rejected Alternatives**: Keep `github.com/fall-out-bug/portolan` as public
identity; document both paths; hide the mismatch in release notes; rely only on
source checkout.

**Why Now**: Public install is the first evaluator experience.

**Reversibility**: Medium. Module path changes are possible but touch imports,
docs, release commands, and external users after release.

**Risk If Wrong**: Broken installs, stale links, and support churn.

**Confidence**: high

### D-004 - First public version is v0.1.0 with restrained launch copy

**Decision**: Use `v0.1.0` for the first public release and write release copy
as a concise technical launch note: what it is, quick start, verified
boundaries, known limits, and Apache Bigtop demo route.

**Rejected Alternatives**: Use an unversioned "public beta"; write a broad
marketing announcement; add unverified badges; claim adoption.

**Why Now**: A clean first tag gives external users a stable reference without
pretending the product is mature.

**Reversibility**: Medium after publication because the tag and release notes
may be quoted externally.

**Risk If Wrong**: The release either looks unfinished or overclaims maturity.

**Confidence**: high

### D-005 - v0.1.0 is source-first

**Decision**: Publish `v0.1.0` as a source-first release: Git tag, GitHub
release notes, `go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0`,
and source-checkout bootstrap. Prebuilt binaries are deferred unless a
maintainer explicitly expands the release.

**Rejected Alternatives**: Ship cross-platform prebuilt binaries immediately;
publish a binary-only release; skip a release and rely on `main`.

**Why Now**: Source-first is the lowest-risk public path while module identity
and demo/community surfaces are being stabilized.

**Reversibility**: High. Prebuilt binaries can be added in a later release or
within this slice after extra verification.

**Risk If Wrong**: Some users may prefer downloaded binaries over `go install`
or source bootstrap.

**Confidence**: medium

### D-002 - Manual first release before automation

**Decision**: Use manual release checklist plus tests/checksums for the first
public release.

**Rejected Alternatives**: Add GoReleaser immediately; publish Homebrew/Docker
first; skip release artifacts and use README only.

**Why Now**: The repo already has a working release checklist and version
injection tests.

**Reversibility**: High. Automation can be added after the manual path is
trusted.

**Risk If Wrong**: Some maintainer toil remains for the first release.

**Confidence**: high

### D-003 - Claims stay governed by product-claims

**Decision**: Release notes and README launch copy must derive positive claims
from `docs/product-claims.md`.

**Rejected Alternatives**: Write marketing copy directly from backlog status or
review anecdotes.

**Why Now**: Public popularization increases the cost of overclaiming.

**Reversibility**: High before release, lower after external readers quote it.

**Risk If Wrong**: Portolan loses its evidence-discipline positioning.

**Confidence**: high
