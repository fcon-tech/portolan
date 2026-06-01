# Clean Baseline Comparison Correction

Date: 2026-06-01

Spec: `docs/specs/052-dependency-symbol-evidence-import/`

Status: accepted correction implemented locally; fresh Cursor rerun pending

## Compared Artifacts

- Portolan-enabled Cursor + Composer 2.5 lane:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-145759/cursor-composer25-output.md`
- Contaminated no-Portolan baseline:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-145759/cursor-composer25-no-portolan-baseline-output.md`
- Clean no-Portolan baseline:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-145759/cursor-composer25-no-portolan-clean-baseline-output.md`

## Boundary Finding

The first no-Portolan baseline was contaminated because it inspected
`selection.json` from the target root. It is retained only as degraded
evidence and does not count as a clean comparison lane.

The clean baseline used a temporary hardlink copy at
`/tmp/portolan-052-clean-baseline-20260601-150906/repos` and excluded
`.portolan/`, root `run/`, selection, graph, map, and stress ledgers. The
temporary copy was removed after the lane.

## Product Finding

The clean baseline found useful source-visible build/deploy relationship
candidates that the Portolan-enabled lane did not foreground:

- `apache-bigtop-repo/bigtop.bom` distribution/build ordering;
- RPM specs under `bigtop-packages/src/rpm/**/SPECS/*.spec`;
- Puppet deployment manifests under `bigtop-deploy/puppet/`;
- Maven, Gradle, Ivy, and Ant build manifests across sibling repositories;
- version mismatch signals between sibling repo source versions and Bigtop BOM
  pins.

These are not parsed relationship claims and do not prove runtime topology.
They are high-value source-visible navigation targets for an agent answering
CTO-level landscape questions.

## Accepted Correction

`portolan context prepare` now emits bounded `relationship-candidate` records
in `evidence-index.jsonl` for build/deploy surfaces:

- `build-manifest`
- `distribution-manifest`
- `rpm-spec`
- `deployment-manifest`

Each record remains `source-visible`, includes a sample path and count, and
states that semantic parsing remains `not_assessed`. Generated
`answer-contract.md` and `query-plan.md` tell agents to inspect those records
before opening raw source and not to treat them as service topology.

## Verification

- `go test -count=1 ./internal/app -run TestRunContextPrepareWritesCursorPack`:
  verified
- `go test -count=1 ./internal/contextprep ./internal/maprun ./internal/selection`:
  verified

## Not Assessed

- Fresh Cursor + Composer 2.5 rerun after the correction.
- Parsed `bigtop.bom`, RPM, Maven, Gradle, Ivy, Ant, Puppet, or compose
  semantics.
- Runtime topology.
