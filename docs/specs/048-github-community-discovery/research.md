# Research: GitHub Community Discovery

## Decision Gate

### Simpler/Faster

Use standard GitHub community files and a small metadata proposal. Do not build
a custom website, community portal, Discord, docs site, or automation before the
repository landing experience is coherent.

### Blocking Edge Cases

- Security policy requires a real reporting channel and maintainer expectation.
- Topic selection can overclaim category fit.
- GitHub settings and badges are external state and cannot be called verified
  unless inspected after application.
- Contribution templates must not bypass SpecKit or encourage broad rewrites.

### Existing Open Source

- GitHub's community file conventions solve most discovery and contribution
  needs.
- GitHub private vulnerability reporting is the preferred OSS disclosure route
  for this repository because it is built into public GitHub repositories and
  keeps sensitive reports private.
- Contributor Covenant is a common conduct baseline, but adoption is a
  maintainer decision.
- OpenSSF Scorecard and Best Practices can become later signals, but badges are
  misleading until configured and checked.

## Decisions

### D-001 - Standard GitHub community files first

**Decision**: Use `CONTRIBUTING.md`, `SECURITY.md`, conduct guidance,
`SUPPORT.md`, issue templates, and PR template as the first OSS-health layer.

**Rejected Alternatives**: Build a docs website first; rely only on README;
create a custom contribution process.

**Why Now**: GitHub community files are visible, conventional, and cheap.

**Reversibility**: High.

**Risk If Wrong**: Slight docs churn if the repository later adopts a separate
docs site.

**Confidence**: high

### D-002 - Conservative topic set

**Decision**: Propose topics that map to verified or intended Portolan surfaces:
`ai-agents`, `codebase-analysis`, `code-intelligence`,
`software-architecture`, `evidence-graph`, `local-first`, `go`, `cli`,
`developer-tools`, `oss`, `sbom`, `semgrep`, `cyclonedx`.

**Rejected Alternatives**: Add broader topics such as `observability`,
`service-catalog`, `security-scanner`, `modernization`, or `ai-sdlc` before
claims are validated.

**Why Now**: Topics affect discovery and expectation setting.

**Reversibility**: High.

**Risk If Wrong**: The repo attracts users expecting unsupported behavior.

**Confidence**: medium

### D-003 - No badges without checked state

**Decision**: CI, Scorecard, Best Practices, release, and coverage badges should
be absent or labelled `not_assessed` until current state is checked.

**Rejected Alternatives**: Add aspirational badges to look mature.

**Why Now**: Badges are public claims.

**Reversibility**: High before publication; medium after users see them.

**Risk If Wrong**: Misleading public trust signal.

**Confidence**: high

### D-004 - Use GitHub private vulnerability reporting as primary channel

**Decision**: Recommend GitHub private vulnerability reporting on
`fcon-tech/portolan` as the primary vulnerability disclosure channel. The
maintainer accepted this recommendation. Add a fallback alias only if
`fcon-tech` confirms it exists and is monitored.

**Rejected Alternatives**: Publish a personal maintainer email; ask reporters
to open public issues with sensitive details; leave security reporting entirely
undefined.

**Why Now**: Public launch makes security reporting a real interaction surface.

**Reversibility**: High. `SECURITY.md` can be updated if the organization later
chooses a different mailbox or security manager workflow.

**Risk If Wrong**: Sensitive reports leak into public issues or disappear into
an unmonitored inbox.

**Confidence**: high
