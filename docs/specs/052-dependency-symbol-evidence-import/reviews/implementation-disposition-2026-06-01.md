# Implementation Disposition

Date: 2026-06-01

Spec: `docs/specs/052-dependency-symbol-evidence-import/`

Branch: `codex/052-dependency-symbol-evidence-import`

Status: local_implementation_and_cursor_stress_verified; PR not_started

## Implemented

- Added `symbol-index` as an additive selection/schema `tool_outputs` kind.
- Normalized selected symbol-index outputs into bounded document and symbol
  metadata nodes plus `owns` relationships.
- Kept selected dependency/SBOM outputs as metadata-visible relationship
  evidence and included repository scope in summaries when present.
- Added fail-closed `cannot_verify` handling for malformed, oversized,
  empty, or count-exceeding selected producer outputs.
- Added explicit `not_assessed` relationship findings for absent dependency/SBOM
  and symbol-index producer evidence.
- Updated `context prepare` to summarize symbol-index evidence in
  `tool-registry.json`, `evidence-index.jsonl`, and `gaps.jsonl`.
- Kept `gap-code-index-not-assessed` as a legacy alias when symbol-index
  evidence is absent.
- Updated generated answer-contract guidance so agents do not treat producer
  evidence as native PHP/JVM/Scala language semantics.
- Added clean-start Cursor + Composer 2.5 stress guidance under `reviews/`.
- Raised selected tool-output file-size cap from 16 MB to 64 MB after real
  Bigtop Syft/CycloneDX output measured 28 MB.
- Added bounded `relationship-candidate` records in `context prepare` for
  build/deploy surfaces (`pom.xml`/Gradle/Ant/Ivy, `bigtop.bom`, RPM specs,
  Puppet/compose manifests) after the clean no-Portolan baseline found useful
  source-visible Bigtop relationship evidence that the Portolan-enabled lane
  did not foreground.
- Updated generated answer-contract/query-plan guidance so agents inspect
  build/deploy candidates without treating them as parsed topology.
- Added machine-readable `count` to `relationship-candidate` records after
  review noted that counts should not only live inside human summary text.
- Updated generated Syft/CycloneDX OSS-plan commands to exclude
  `./.portolan/**` and `./run/**`, because root-level Syft runs can otherwise
  include stale Portolan stress artifacts.

## Reviews

| Review | Lanes | Result |
| --- | --- | --- |
| Pre-implementation | Kimi, GLM, MiMo | `pass_with_changes`; accepted findings fixed before code. |
| Post-slice | Kimi, GLM, MiMo | `pass_with_changes`; accepted bounding, alias, and contract findings fixed. |
| Post-fix | Kimi, GLM, MiMo | two `pass_with_changes` with minor documentation/test-verification notes, one `pass`; minor notes dispositioned. |
| Post-correction | Kimi, GLM, MiMo | first attempts `not_assessed` due tool-request output; no-tools retries produced Kimi `pass`, GLM `pass_with_changes`, MiMo `pass`; accepted count/test finding fixed. |
| Post-Syft-exclusion | Kimi, GLM, MiMo | no blockers; accepted exact-arg-test/comment improvement fixed. |

## Verification

| Check | Status |
| --- | --- |
| `go test -count=1 ./internal/selection ./internal/maprun ./internal/contextprep ./internal/app` | verified |
| `go test -count=1 ./...` | verified |
| `go vet ./...` | verified |
| `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json .specify/feature.json` | verified |
| `git diff --check` | verified |
| `go run ./cmd/portolan map --help` | verified |
| `go run ./cmd/portolan context prepare --help` | verified |
| Bigtop Syft/CycloneDX producer smoke | verified |
| Bigtop map with selected Syft SBOM | verified |
| Cursor Agent + Composer 2.5 Portolan-enabled lane | verified |
| Focused context-pack build/deploy candidate test | verified |
| Final Bigtop stress with Syft clean-start exclusions | verified |
| Final Cursor Agent + Composer 2.5 lane on run `20260601-154329` | verified |

## Not Assessed

- Cursor UI behavior outside headless Cursor Agent.
- GitHub PR state, checks, mergeability, and review approval.
- Real SCIP protobuf, LSIF, Serena, Sourcebot, or Zoekt producer outputs.
- Public export/redaction semantics for symbol names, paths, registry URLs, or
  hashes. This slice remains local-only.
- Performance at the declared maximum symbol-index limits.

## Stop Reason

Local implementation, review, and final Portolan-enabled Cursor + Composer 2.5
Bigtop stress run `20260601-154329` are coherent. The clean no-Portolan
baseline exposed an accepted correction: context packs should point agents at
bounded build/deploy relationship candidates before raw source. The final
stress run also forced Syft clean-start exclusions for `.portolan` and root
`run` artifacts. The next product step is generation/import of
symbol/API/catalog/model/runtime producer evidence, not a Portolan-owned
JVM/PHP scanner.
