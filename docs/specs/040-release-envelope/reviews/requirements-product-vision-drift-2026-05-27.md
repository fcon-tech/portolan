# Requirements And Product-Vision Drift Review: Release Envelope

Date: 2026-05-27

Branch: `codex/040-release-envelope-delivery`

Base: `codex/productization-specs` at `872968d`

## Decision Gate

- Simpler/Faster: Use a small GitHub Actions workflow, the existing
  `scripts/bootstrap-portolan` path, and maintainer documentation. Do not add
  package-manager distribution or a release automation framework in this slice.
- Blocking Edge Cases: GitHub checks may remain unavailable until a PR is
  opened; Go module cache may be missing in local no-network bootstrap; release
  notes can overstate unassessed product claims if they do not reference
  `docs/product-claims.md`.
- Existing Open Source: GitHub Actions, Go build/test tooling, `jq`, and shell
  scripts are sufficient. No new Go or release-tool dependency is justified.

## Requirements Drift

- Backlog row P5-040 says the outcome is a repeatable release and install
  envelope with CI, clean-checkout bootstrap smoke, and versioned artifact
  guidance.
- `spec.md` expands that into CI baseline checks, source checkout bootstrap,
  release checklist, checksum guidance, and product-claim boundary review.
- `plan.md`, `contracts/release-envelope.md`, and `quickstart.md` agree on the
  same command set:
  - `go test -count=1 ./...`
  - `jq empty schema/*.json`
  - `git diff --check`
  - `go run ./cmd/portolan --help`
  - `scripts/bootstrap-portolan`
  - `.portolan/bin/portolan --version`
  - `.portolan/bin/portolan context prepare --root . --out /tmp/portolan-context-smoke --profile cursor --force`
  - `.portolan/bin/portolan map --root . --out /tmp/portolan-map-smoke --force`
- `tasks.md` is concrete and independently verifiable. No requirements drift
  found.

## Product-Vision Drift

- The slice preserves local-first/read-only defaults. It adds CI and release
  documentation, not target mutation, daemon behavior, credentials, or runtime
  network behavior.
- The release checklist must keep `not_assessed` limits visible from
  `docs/product-claims.md`. This is aligned with Portolan's evidence-state
  honesty and product-claim gate.
- The slice does not turn Portolan into a harness or scanner replacement.
- No product-vision drift found.

## SpecKit Pipeline Drift

- `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`,
  `quickstart.md`, `tasks.md`, and `checklists/requirements.md` are present.
- `/speckit-clarify` is not separately recorded. The requirement checklist has
  no clarification markers, and remaining assumptions are non-blocking because
  the implementation is docs/workflow/bootstrap oriented.
- Manual analyze disposition is recorded in
  `analyze-disposition-2026-05-27.md`.

## Implementation Permission

Implementation may proceed after the analyze disposition is recorded. The
contract is coherent and does not require changing specs 041-044.
