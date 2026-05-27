# Implementation Disposition: OSS Producer Acceptance

## Outcome

This slice produced the missing SpecKit planning artifacts, installed the
approved OSS producer tools, fixed a Portolan context-pack contract defect, and
ran the first real local Bigtop OSS producer acceptance attempt.

Syft/CycloneDX is verified on the fixed Bigtop target. jscpd and Semgrep are not
verified for product claims.

## What Changed

- Added `plan.md`, `research.md`, `data-model.md`, `quickstart.md`,
  `contracts/producer-acceptance-ledger.md`, and `tasks.md`.
- Updated `context prepare --force` to preserve existing
  `<out>/tool-outputs/` files and detect them during rerun.
- Added a regression test for preserving context-local producer outputs.
- Recorded preconditions and producer acceptance evidence under
  `specs/035-oss-producer-acceptance/reviews/`.
- Updated spec/backlog status to avoid overstating near-clone or Semgrep
  validation.

## Verification

- `verified`: Bigtop target exists locally.
- `verified`: `jscpd` 4.2.4, `syft` 1.44.0, and `semgrep` 1.157.0 are
  installed.
- `verified`: Syft generated
  `/tmp/portolan-035-bigtop-context/tool-outputs/syft.cyclonedx.json`.
- `verified`: CycloneDX output is valid JSON and reports 18,769 components plus
  5,357 dependency records.
- `verified`: `context prepare --force` preserved the Syft output and recorded
  CycloneDX as `observed` / `metadata-visible` in `tool-registry.json`.
- `verified`: `oss-plan.json` marks CycloneDX as `input_present`.
- `failed`: the default full Bigtop `jscpd` invocation was interrupted after
  unbounded clone stdout and before JSON output was written.
- `not_assessed`: Semgrep producer output, because no local config was found and
  network-backed configs are outside the default safety boundary.

## Review Evidence

- Local review: accepted. The result preserves evidence-state honesty and does
  not turn the failed jscpd run into validation.
- Model slice reviewers: `not_assessed`; this slice now includes a narrow code
  fix and still needs PR-level review before ready-for-review PR status.

## Not Assessed

- Bounded jscpd profile for large generated-file-heavy targets.
- Semgrep execution with a local config.
- Whether the Syft SBOM changes a human or agent answer beyond component
  identity availability.
- GitHub checks and human review approval.
- Merge approval.

## Risk

The fix preserves context-local producer files by copying regular files from
`<out>/tool-outputs/` into the replacement context pack. Very large producer
outputs may make `context prepare --force` slower, but preserving selected
output artifacts is required for the advertised producer workflow to work.
