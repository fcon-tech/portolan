# PR Readiness Closeout: Spec 072

Date: 2026-06-02
Branch: `codex/072-existing-artifact-jdeps`
PR: https://github.com/fcon-tech/portolan/pull/50

## Implementation State

verified:

- SpecKit active pointer updated to
  `docs/specs/072-existing-artifact-jdeps`.
- `AGENTS.md` SPECKIT pointer updated to spec 072 plan.
- Product backlog includes P6-072.
- `spec.md`, `plan.md`, and `tasks.md` exist.
- Existing-artifact `jdeps` producer output was generated externally under the
  Bigtop landscape stress root.
- Producer ledger records tool path, version, selected-root provenance, artifact
  paths, row counts, unresolved rows, path validation, hashes, and evidence
  boundary.
- Cursor Composer 2.5 claim-boundary stress is recorded.
- Review disposition records three assessed non-GPT lanes: DeepSeek, MiMo retry,
  and GLM.

## Evidence Result

verified:

- `jdeps` 26.0.1 exited `0` for all 9 assessed existing `.jar`/`.class`
  artifacts.
- 8 of 9 assessed artifacts emitted dependency rows; `cachedir.jar` emitted no
  dependency rows.
- Output contains 289 package dependency rows and 16 unresolved `not found`
  rows.
- All 9 assessed artifacts are regular files under selected Bigtop target roots.
- The evidence is a real producer output beyond Syft/CycloneDX and beyond
  ctags-only source tagging for the narrow compiled-artifact scope.

partial:

- C6 is stronger only for bounded existing-artifact JVM dependency evidence.
- Artifact evidence is dominated by bundled third-party test/resource jars and
  tiny UDF fixtures, not Bigtop production build outputs.

cannot_verify:

- Full source-level symbol/reference graph.
- Method/class/type source references.
- Cross-reference resolution.
- Call graph.
- Runtime topology.
- Human/enterprise architecture parity.

## Local Verification

verified:

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

## Review State

verified:

- DeepSeek V4 Pro: assessed.
- MiMo V2.5 Pro: initial malformed/tool-request output recorded as
  `not_assessed`; retry assessed and counted.
- GLM 5.1: assessed.
- Accepted findings were applied to `spec.md`, `plan.md`, backlog row,
  producer ledger, Cursor stress ledger, and review disposition.

## PR State

verified on PR head `95b08e5c7ef7d3ca2d24e85eb46999d85a3c2cbb` before this
closeout update:

- PR #50 exists: https://github.com/fcon-tech/portolan/pull/50
- Draft state: draft.
- Merge state: `CLEAN`.
- Baseline: success.
- CodeQL Analyze (go): success.
- CodeQL Analyze (actions): success.
- CodeQL Analyze (python): success.
- CodeQL: success.

not_assessed until this closeout update is pushed:

- Refreshed GitHub checks for the final PR head.
- Final draft state after refreshed checks.
- GitHub review approval.

## Ready-For-Review Decision

Ready-for-review PR: yes, after this closeout update is pushed, GitHub checks
refresh successfully on the final head, and draft state is removed.

Ready-to-merge PR: no. GitHub review approval is not assessed, and merge still
requires explicit user approval plus merge closeout.

Stop reason: publish the closeout update, refresh checks, and remove draft if
checks pass. This is not a ready-to-merge surface.
