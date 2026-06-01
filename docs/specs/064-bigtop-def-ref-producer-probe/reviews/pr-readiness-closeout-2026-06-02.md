# PR Readiness Closeout: Spec 064

Date: 2026-06-02
Branch: `codex/064-bigtop-def-ref-producer-probe`

## Scope

This is a read-only def/ref feasibility probe. It does not install indexers,
build target repositories, or claim full symbol/reference graph evidence.

## Implementation State

verified:

- Tool availability probe was recorded with explicit `found` / `not_found`
  states.
- Full def/ref indexer producers were absent from PATH:
  `scip`, `codeql`, `srcml`, `lsif-java`, `lsif-go`, `src-cli`,
  `java-language-server`, `jdtls`.
- `gradle` was absent from PATH and classified as a build tool, not an indexer.
- Partial/adjacent tools were present: `ctags`, `gopls`, `javap`, `jdeps`,
  `mvn`.
- Selected probe roots had 203 `pom.xml`, 31 `build.gradle*`, 0
  `target/classes` directories, and 0 `.class` files.
- The only jar found was a Bigtop test resource jar; `jdeps` exit `0` proved
  tool functionality only and produced no project-level graph evidence.
- Output hashes and sizes were recorded.

Cursor stress:

- Cursor Agent `composer-2.5` preserved full symbol/reference graph, call graph,
  and enterprise parity as `cannot_verify`.
- Cursor identified next action as explicit approval for indexer install or
  target repo build.

Review evidence:

- GLM 5.1 assessed.
- DeepSeek V4 Pro assessed.
- MiMo V2.5 Pro assessed.
- Accepted findings were fixed and dispositioned.

## Local Verification

verified:

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

## Evidence State After This Slice

verified:

- Def/ref producer blocker evidence for selected Hadoop/HBase/Bigtop probe
  roots.
- Cursor boundary preservation.
- Independent review disposition.
- Local baseline.

cannot_verify:

- Full symbol/reference graph.
- Call graph.
- Enterprise code-intelligence parity.

blocked:

- Installing/enabling a full def/ref indexer.
- Building selected repos to produce compiled artifacts.

## PR Readiness Decision

Ready-for-review PR: yes, after commit, push, PR creation, and GitHub checks.

Ready-to-merge PR: not_assessed.

Merge approval: not_assessed.
