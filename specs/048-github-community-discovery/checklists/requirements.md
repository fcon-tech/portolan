# Requirements Checklist: GitHub Community Discovery

**Purpose**: Validate that the specification is complete enough before
implementation.

**Created**: 2026-05-30

**Feature**: `specs/048-github-community-discovery/spec.md`

## Content Quality

- [x] User value is clear for visitors, contributors, and security reporters
- [x] Scope is bounded to GitHub/community discovery
- [x] Public claim limits are explicit
- [x] GitHub external state is separated from repo-local files
- [x] Success criteria are measurable

## Requirement Completeness

- [x] Repository metadata requirements are specified
- [x] Community file requirements are specified
- [x] Issue and PR template requirements are specified
- [x] Security policy limits are specified
- [x] Badge and Scorecard states cannot be assumed green

## Blocking Questions

- [x] Recommended security reporting pattern recorded: GitHub private
  vulnerability reporting first, monitored alias only if approved
- [x] Maintainer approved GitHub private vulnerability reporting as primary
  security contact path
- [ ] Repository admin has enabled or rejected GitHub private vulnerability
  reporting for `fcon-tech/portolan`
- [x] No fallback email alias is approved for v1 unless separately confirmed
- [ ] Maintainer has approved conduct policy choice
- [ ] Maintainer has approved repository description, homepage, and topics
- [ ] Maintainer has decided whether to apply GitHub settings in this slice
