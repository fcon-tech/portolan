# Full Bigtop Landscape Scan Result - 2026-05-21

## Inputs

- Manifest: `internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json`
- Local repository directory:
  `/Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/repos`
- Generated selection:
  `/Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/selection.json`
- Run directory:
  `/Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/run`

## Preparation

Command:

```bash
go run ./cmd/portolan selection generate-bigtop \
  --manifest internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json \
  --repo-dir /Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/repos \
  --out /Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/selection.json \
  --force
```

Result: generated a full-corpus selection with 15 local repository targets.

## Map Run

Command:

```bash
go run ./cmd/portolan map \
  --selection /Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/selection.json \
  --out /Users/fall_out_bug/projects/faust/sdp/bigtop-landscape/run \
  --force
```

Result: wrote the five required artifacts:

- `run.json`
- `coverage.json`
- `graph.json`
- `findings.jsonl`
- `map.md`

## Coverage Evidence

`coverage.json` summary:

```json
{
  "evidence_state:metadata-visible": 13,
  "evidence_state:source-visible": 31,
  "status:represented": 12,
  "status:visible": 32,
  "total": 44
}
```

Blocking records: none.

Active/external product repository gate: verified locally. The generated
selection includes all active/external manifest repositories as local
repository targets, and the map run completed without full-corpus blockers.

## Packet Evidence

`map.md` includes these CTO packet sections:

- Landscape Inventory
- Repo/Product Matrix
- Contracts And Surfaces
- Duplication
- Configuration
- Legacy And Debt
- Unknowns And Cannot Verify
- Machine Artifact Summary
- Next-Agent Tasks

`map.md` is bounded for human review: 394 lines after rendering the full
Bigtop run. The full machine detail remains in `graph.json` and
`findings.jsonl`.

## Residual Risk

This run proves local source visibility and artifact generation. It does not
prove release-ref parity with the Bigtop 3.5.0 BOM; repository checkout HEADs
remain source-visible evidence, while version alignment remains metadata-bound.
