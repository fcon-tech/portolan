# PR 50 Merge Closeout: Spec 072

Date: 2026-06-02
PR: https://github.com/fcon-tech/portolan/pull/50
Branch: `codex/072-existing-artifact-jdeps`

## Merge State

verified:

- PR #50 was marked ready-for-review before merge.
- PR #50 was merged at `2026-06-02T02:16:33Z`.
- Squash merge commit: `cad48cb9120799ca1c3a5efe0f6c5cd6d030dad0`.
- Pre-merge PR head: `edb5b6b2c70463caadc6b6f9a484c2471520629f`.
- Local `main` was fast-forwarded to include the squash merge commit.
- Remote branch `codex/072-existing-artifact-jdeps` was deleted manually after
  the local checkout step failed because `main` is already used by the primary
  worktree.

not_assessed:

- GitHub review approval remained blank / not assessed before merge.

## Check State

verified on PR head `edb5b6b2c70463caadc6b6f9a484c2471520629f`:

- Baseline: success.
- CodeQL Analyze (go): success.
- CodeQL Analyze (actions): success.
- CodeQL Analyze (python): success.
- CodeQL: success.

verified locally before PR readiness:

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

## Evidence State After Merge

verified:

- `jdeps` 26.0.1 produced bounded package/module dependency evidence for 9
  existing `.jar`/`.class` artifacts already present under selected Bigtop
  target roots.
- All 9 assessed artifacts exited `0`.
- 8 of 9 assessed artifacts emitted dependency rows; `cachedir.jar` emitted no
  dependency rows.
- Output contains 289 package dependency rows and 16 unresolved `not found`
  rows.
- All 9 assessed artifacts are regular files under selected Bigtop target roots.
- Cursor Composer 2.5 stress preserved the C6/runtime/enterprise boundary.
- DeepSeek, MiMo retry, and GLM review lanes were assessed.

partial:

- C6 symbol/reference graph is stronger than spec 071 only for bounded
  existing-artifact JVM package/module dependency evidence.
- Artifact evidence is narrow and dominated by bundled third-party
  test/resource jars plus tiny UDF fixtures, not Bigtop production build
  outputs.

cannot_verify:

- Full source-level symbol/reference graph.
- Method/class/type source references.
- Cross-reference resolution.
- Call graph.
- Runtime topology.
- Human/enterprise code-intelligence parity.

## Status Decision

Spec 072 is merged and closed as a bounded C6 compiled-artifact dependency
improvement. It proves a narrow `jdeps` producer output beyond Syft/CycloneDX
and ctags-only source tagging, but it does not verify full symbol/reference
graph, call graph, runtime topology, or enterprise architecture parity.
