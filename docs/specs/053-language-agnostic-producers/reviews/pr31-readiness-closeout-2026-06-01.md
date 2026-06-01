# PR 31 Readiness Closeout

Date: 2026-06-01

PR: https://github.com/fcon-tech/portolan/pull/31

Branch: `codex/post-merge-navigation-guidance`

## Scope

Post-merge guidance correction after PR #30 and Cursor + Composer 2.5 Bigtop
stress:

- clarify generated `agent-brief.md`, `answer-contract.md`, and
  `query-plan.md` around Go/go.mod-only native relationship extraction;
- keep missing producer evaluations as `not_assessed` without synthetic
  evaluation records;
- separate `context/gaps.jsonl` producer acquisition gaps from `portolan query
  gaps` map-bundle weak records;
- add observed CycloneDX component/dependency counts and SBOM fan-out guidance
  to the agent brief;
- record stress output, model review, and review disposition under spec 053.

## Verification

Local verification:

- `go test -count=1 ./internal/app ./internal/contextprep ./internal/query`:
  verified
- `go test -count=1 ./...`: verified
- `go vet ./...`: verified
- `jq empty schema/*.json`: verified
- `git diff --check`: verified
- `go run ./cmd/portolan context prepare --help`: verified
- `go run ./cmd/portolan query --help`: verified

Stress verification:

- Cursor + Composer 2.5 corrected run `20260601-191803`: verified
- Root `/home/fall_out_bug/projects/bigtop-landscape/run`: absent after the
  corrected run
- Syft/CycloneDX output preserved in refreshed context:
  18,769 components and 5,357 dependency records
- Final Cursor verdict: conditional pass for the navigation harness and complete
  anti-adapter guidance; remaining SBOM-scale and `unknown` node navigation work
  recorded as follow-up

Review evidence:

- Kimi no-tools review lane: assessed
- Accepted review findings fixed:
  - local producer evaluation count now includes `not_assessed` wording;
  - CycloneDX component wording no longer implies every CycloneDX file was
    produced by Syft;
  - native map relationship extraction wording no longer implies roadmap
    intent with "currently".
- Rejected review findings dispositioned in
  `post-merge-guidance-review-disposition-2026-06-01.md`.

GitHub checks:

- `Baseline`: verified passing before this closeout update
- `Analyze (actions)`: verified passing before this closeout update
- `Analyze (go)`: verified passing before this closeout update
- `Analyze (python)`: verified passing before this closeout update
- `CodeQL`: verified passing before this closeout update

Because this closeout updates the PR head, GitHub checks must be refreshed after
the final push before treating PR #31 as current ready-for-review evidence.

## Readiness Matrix

- Implementation: verified
- Local verification: verified
- Review evidence: verified
- Requirements drift: verified; this remains a guidance correction for spec 053,
  not a new scanner, producer runner, or per-language adapter
- Product vision drift: verified; local-first/read-only and evidence-state
  honesty preserved
- PR state: ready-for-review after final push and refreshed checks
- GitHub checks: refresh required after this closeout commit
- Merge readiness: not ready-to-merge; GitHub review approval and explicit
  merge approval for PR #31 remain `not_assessed`
- Stop reason: ready-for-review once refreshed GitHub checks pass
