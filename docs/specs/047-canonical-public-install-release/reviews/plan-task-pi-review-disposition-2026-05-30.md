# Plan And Task Review Disposition

**Date**: 2026-05-30

**Scope**: Pre-implementation review of `spec.md`, `plan.md`, `tasks.md`, and
`contracts/public-install-release.md` for spec 047.

## Review Lanes

| Lane | Status | Verdict | Notes |
| --- | --- | --- | --- |
| `kimi-coding/kimi-for-coding` | assessed | `CHANGES_REQUESTED` | Found missing execute-and-record smoke semantics, weak identity scan gate, package-manager claim audit gap, and release closeout field ambiguity. |
| `zai/glm-5.1` | assessed after retry | `CHANGES_REQUESTED` | Found missing internal Go import migration task and missing canonical identity regression check. Initial attempt failed with `database is locked` and did not count. |
| `minimax/MiniMax-M2.7` | not_assessed | n/a | Direct lane returned `404 page not found`; not counted as review evidence. |
| `openrouter/minimax/minimax-m2.7` | assessed replacement | `CHANGES_REQUESTED` | Fallback lane required `--thinking low`; found identity criteria, claim scan, Bigtop demo route, and closeout gaps. |

## Accepted Findings

- Add an explicit Go internal import migration task before release/docs copy.
- Add a canonical identity regression check instead of relying only on one-off
  review notes.
- Define identity scan pass criteria.
- Change smoke/checksum/claim tasks from passive "record" wording to
  execute-and-record wording.
- Add release-note package-manager claim scan.
- Add a Bigtop demo route verification task before release notes claim a demo
  path.
- Require release closeout fields for local checks, GitHub checks, release
  publication, adoption/popularity, merge approval, and stop reason.
- Clarify `docs/releases/v0.1.0.md` as the canonical source for later GitHub
  release publication.

## Rejected Or Narrowed Findings

- MiniMax F-001 claimed `go install` conflicts with source-first release because
  it "fetches prebuilt binaries from proxy.golang.org". Rejected: `go install`
  resolves module source and builds the command locally; it does not consume a
  prebuilt Portolan binary. The underlying concern is still handled by making
  network package fetching explicit and keeping downloaded prebuilt binaries
  out of scope.
- MiniMax F-002 treated missing `docs/product-claims.md` in the review packet
  as a critical blocker. Narrowed: the file exists in the repository and will
  be checked during implementation; the task contract now requires an explicit
  product-claim scan before release closeout.
- MiniMax F-007 suggested resetting the active SpecKit pointer after
  implementation. Rejected for this slice: `.specify/feature.json` should point
  at the active 047 work until PR/readiness closeout; moving to later specs is
  separate backlog selection work.
- MiniMax F-005 requested separate constitution evidence links in `plan.md`.
  Narrowed: this review disposition plus final closeout will record the
  constitution drift review; editing the already concrete plan is not needed
  before implementation.

## Task Contract Changes

Updated `tasks.md` to add or refine:

- T008 internal Go import path migration.
- T011 canonical identity regression check.
- T016-T017 execute-and-record identity migration verification.
- T021 execute-and-record public install smoke.
- T022 prebuilt binary scope lock.
- T023 canonical release-note source wording.
- T025 Bigtop demo route verification.
- T026-T027 execute-and-record build/checksum and claim scans.
- T028 release closeout mandatory fields.
- T035 release-note claim-contract scan.

## Decision

`CHANGES_REQUESTED` is dispositioned as fixed in the task contract. Proceed to
implementation with the strengthened task ledger.
