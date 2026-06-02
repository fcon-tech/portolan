# Feature Specification: Bigtop Def/Ref Producer Probe

**Feature Branch**: `codex/064-bigtop-def-ref-producer-probe`

**Created**: 2026-06-02

**Status**: Merged via PR #42

**Input**: Full symbol/reference graph remains `cannot_verify` after ctags
definition inventory and Semgrep mention evidence. The objective requires
Portolan+Cursor to avoid enterprise code-intelligence claims without def/ref
evidence.

## Requirements

- **FR-001**: The feature MUST probe full def/ref producer availability
  read-only.
- **FR-002**: The feature MUST distinguish definition-only tools from def/ref
  indexers.
- **FR-003**: The feature MUST inspect whether compiled Java artifacts exist for
  `jdeps`/`javap`-style reference extraction without building the target repos.
- **FR-004**: If no def/ref producer can run safely, the result MUST be
  `cannot_verify` with exact tool/artifact evidence.
- **FR-005**: Existing ctags, Semgrep, and static producer outputs MUST NOT be
  upgraded to full symbol/reference or call graph evidence.
- **FR-006**: Cursor stress MUST preserve the blocker and identify the next
  required approval/tooling path.

## Success Criteria

- **SC-001**: Tool availability is recorded for SCIP/LSIF/CodeQL/srcml/JDTLS,
  ctags, gopls, javap, jdeps, Maven, and Gradle.
- **SC-002**: Build artifact presence is recorded for selected Java-heavy
  Bigtop repos.
- **SC-003**: Any `jdeps` result is bounded and not promoted to project graph
  evidence unless project classes exist.
- **SC-004**: Cursor stress preserves full def/ref as `cannot_verify`.
- **SC-005**: Local baseline checks pass before PR readiness.

## Assumptions

- Selected probe repos are `apache-hadoop`, `apache-hbase`, and
  `apache-bigtop-repo`.
- Building those repos is out of scope because it can mutate target repos, fetch
  dependencies, execute build logic, and take substantial time.
