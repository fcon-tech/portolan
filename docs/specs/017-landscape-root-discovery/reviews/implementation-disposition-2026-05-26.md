# Implementation Review Disposition: 017 Landscape Root Discovery

Date: 2026-05-26

## Scope Reviewed

- `portolan map --root` bounded repository discovery
- generated in-memory selection targets for discovered repositories
- coverage records for local repositories and external completeness
- repo-like/no-Git mismatch handling
- single-root compatibility behavior
- blind acceptance and Cursor/agent documentation

## Decision

`map --root` now discovers a local landscape without requiring
`selection.json`. The bounded policy is:

- target root itself when it is a Git repository;
- direct child Git repositories;
- direct children of a conventional `repos/` directory.

The selection contract remains available for curated advanced inventories, but
it is no longer required for the normal blind/root mapping path.

## Accepted Findings Fixed During Implementation

- `kimi-coding/kimi-for-coding`: `not_assessed`; returned tool-call text
  instead of review findings.
- `minimax/MiniMax-M2.7`: `not_assessed`; model endpoint returned `404`.
- `zai/glm-5.1`: `not_assessed`; returned no actionable findings.
- Local repo-grounded review: major findings accepted and fixed.
- Single-root relationship edge IDs were initially prefixed through the
  generated-selection path; fixed to preserve legacy single-root relationship
  graph IDs.
- `external-completeness: unknown` initially produced a technical-debt finding;
  fixed because ecosystem completeness is an evidence boundary, not a debt
  finding by itself.
- Local repo-grounded review found that no-Git root and direct-child repo-like
  directories needed explicit discovery gaps; fixed with `root-git-not-found`,
  `repo-like-structure-without-git`, `non-git-child-directories`, and
  `non-repository-children` coverage records.
- Focused local re-review found no remaining critical or major findings for the
  prior no-Git root, repo-like child, skipped input, or single-root
  compatibility themes.

## Verification

- `go test -count=1 ./...`: passed
- `jq empty schema/*.json`: passed
- `git diff --check`: passed
- Synthetic root smoke:
  - `go run ./cmd/portolan map --root <tmp-landscape> --out /tmp/portolan-017-root-map --force`
  - coverage recorded `api` and `web` as `source-visible`
  - coverage recorded `external-completeness` as `unknown`
  - coverage recorded direct non-repository child inputs as `not_assessed`
- Local Bigtop root smoke:
  - `go run ./cmd/portolan map --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-017-bigtop-root-map --force`
  - coverage recorded 18 visible repositories, `external-completeness:
    unknown`, and additional repository-discovery gaps for local non-repository
    inputs

## Not Assessed

- Cursor + Composer 2.5 blind operator execution.
- Manifest-backed external completeness.
- Deep recursive repository discovery beyond root/direct-child/`repos/*`.
- Runtime topology and non-Go relationship detection.
