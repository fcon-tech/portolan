# Implementation Plan: Bigtop Def/Ref Producer Probe

**Branch**: `codex/064-bigtop-def-ref-producer-probe`

## Decision Gate

- **Simpler/Faster**: Treat ctags/Semgrep as enough. Rejected because ctags is
  definitions-only and Semgrep is mention evidence, not references/calls.
- **Blocking Edge Cases**: Full Java def/ref usually needs indexers, language
  servers, or compiled artifacts. Building Hadoop/HBase/Bigtop can execute
  build logic, fetch dependencies, and write target directories.
- **Existing Open Source**: Prefer mature exporters/indexers such as SCIP, LSIF,
  CodeQL, srcML/JDTLS, jdeps/javap when artifacts exist. Do not write a native
  Portolan def/ref scanner.

## Probe Result

verified:

- Missing full def/ref/index producers in the current PATH:
  - `scip`
  - `codeql`
  - `srcml`
  - `lsif-java`
  - `lsif-go`
  - `src-cli`
  - `java-language-server`
  - `jdtls`
- Available partial/adjacent tools:
  - `ctags`
  - `gopls`
  - `javap`
  - `jdeps`
  - `mvn`
- Build metadata exists, but `gradle` is not in PATH:
  - 203 `pom.xml`
  - 31 `build.gradle*`
- Compiled project artifacts are absent in selected repos:
  - 0 `target/classes` directories
  - 0 `.class` files
- Only one jar exists in the selected probe scope:
  `apache-bigtop-repo/bigtop-tests/test-artifacts/hadoop/src/main/resources/cachedir.jar`.

cannot_verify:

- Full symbol/reference graph.
- Call graph.
- Enterprise code-intelligence parity.

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
