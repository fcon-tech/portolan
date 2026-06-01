# Post-Correction Review Packet

Date: 2026-06-01

Spec: `docs/specs/052-dependency-symbol-evidence-import/`

Branch: `codex/052-dependency-symbol-evidence-import`

Review plane: evidence semantics, context-pack UX for agents, bounded scanning,
path/output safety, and test coverage.

## Correction Being Reviewed

The clean no-Portolan Cursor + Composer 2.5 baseline found useful
source-visible Bigtop relationship hints that the Portolan-enabled context did
not foreground:

- `apache-bigtop-repo/bigtop.bom`
- RPM specs under `bigtop-packages/src/rpm/**/SPECS/*.spec`
- Puppet manifests under `bigtop-deploy/puppet/`
- Maven, Gradle, Ivy, and Ant build manifests

The implemented correction adds bounded `relationship-candidate` records to
`portolan context prepare`:

- `kind`: `relationship-candidate`
- families: `build-manifest`, `distribution-manifest`, `rpm-spec`,
  `deployment-manifest`
- evidence state: `source-visible`
- source artifact: `source-tree`
- reason: semantic parsing remains `not_assessed`

These records are intended as navigation hints. They must not be treated as
parsed service topology, runtime behavior, or native JVM/PHP/Scala semantics.

## Code Areas

- `internal/contextprep/contextprep.go`
  - adds `RelationshipCandidate`
  - walks discovered repositories with a per-repo scan limit
  - skips heavy/generated directories
  - emits candidate records into `evidence-index.jsonl`
  - updates `agent-brief.md`, `answer-contract.md`, and `query-plan.md`
- `internal/app/app_test.go`
  - extends context-pack fixture with `pom.xml`, `bigtop.bom`, RPM spec, and
    Puppet manifest
  - asserts candidate families and answer-contract wording
- Spec docs under
  `docs/specs/052-dependency-symbol-evidence-import/`
  - add relationship-candidate model/contract/tasks/review disposition

## Local Verification

- `go test -count=1 ./internal/app -run TestRunContextPrepareWritesCursorPack`:
  passed
- `go test -count=1 ./internal/contextprep ./internal/maprun ./internal/selection`:
  passed
- `go test -count=1 ./...`: passed
- `go vet ./...`: passed after fixing a bad `fmt.Sprintf` format string
- `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json .specify/feature.json`:
  passed
- `git diff --check`: passed
- `go run ./cmd/portolan context prepare --help`: passed
- `go run ./cmd/portolan map --help`: passed

## Fresh Stress Evidence

Run:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/`

Context:

- 18 repositories discovered
- 30 relationship-candidate records:
  - 18 build-manifest
  - 10 deployment-manifest
  - 1 distribution-manifest
  - 1 rpm-spec
- Syft/CycloneDX output:
  - 28 MB
  - 18,777 components
  - 5,359 dependency records

Map:

- 190,756 graph nodes
- 200,215 graph edges
- 274 findings
- 106 `not_assessed` findings
- 6 `cannot_verify` findings
- `finding-tool-output-bigtop-syft-cyclonedx` observed
  metadata-visible producer evidence
- `finding-relationships-symbol-evidence-not-assessed` remains
  `not_assessed`

Cursor Agent + Composer 2.5:

- Used fresh run `20260601-152244`
- Identified 30 `relationship-candidate` records
- Named `bigtop.bom`, RPM specs, Puppet/compose, Maven/Gradle/Ivy/Ant
  manifests
- Preserved `not_assessed` for semantic parsing and runtime topology
- Did not claim Portolan has native JVM/PHP/Scala semantics

## Review Questions

1. Does the correction preserve evidence-state honesty, especially
   `source-visible` candidates versus parsed `metadata-visible` relationships?
2. Are any candidate-detection rules likely to overclaim service topology,
   runtime behavior, or language semantics?
3. Are bounded scanning and skipped directory rules sufficient for large local
   enterprise landscapes?
4. Are the tests and docs sufficient for this behavior change?
5. What findings, if any, should block PR readiness for this slice?

## Required Output Shape

Return:

- `findings`: ordered by severity (`critical`, `major`, `minor`)
- `verdict`: `pass`, `pass_with_changes`, or `fail`
- `not_assessed`: explicit gaps in your review
- `recommendation`: concise next action

Preserve `unknown`, `cannot_verify`, and `not_assessed` as valid states. Do not
collapse them into pass/fail.
