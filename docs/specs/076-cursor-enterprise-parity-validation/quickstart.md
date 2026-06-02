# Quickstart: Cursor Enterprise Parity Validation

## Preflight

1. Verify the active Portolan checkout is clean and synced with the intended
   base.
2. Verify spec 074 runtime-health evidence exists. If it does not, stop the
   default parity run and record `blocked`.
3. If the user explicitly approves a current-evidence rejection run, record the
   approval text and keep runtime topology and broad parity `cannot_verify`.
4. Verify specs 075 and 077 closeouts are current.
5. Create a fresh Bigtop stress root:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<timestamp>-076-cursor-enterprise-parity/
```

6. Record forbidden legacy paths for the baseline lane, including any old
   top-level `run/` directory and prior `.portolan/stress/*` roots.

## Portolan Artifact Refresh

Run only after the preflight gate is satisfied:

```bash
go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<timestamp>-076-cursor-enterprise-parity/context --profile agent --force
go run ./cmd/portolan map --selection /home/fall_out_bug/projects/bigtop-landscape/selection.json --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<timestamp>-076-cursor-enterprise-parity/map-selection --force
go run ./cmd/portolan map --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<timestamp>-076-cursor-enterprise-parity/map-root --force
```

## Cursor Lanes

1. Save the shared prompt to
   `docs/specs/076-cursor-enterprise-parity-validation/stress/cursor-enterprise-parity-prompt-2026-06-02.md`.
2. Run Cursor Composer 2.5 baseline with Portolan artifacts forbidden.
3. Save the baseline output to
   `docs/specs/076-cursor-enterprise-parity-validation/stress/cursor-baseline-output-2026-06-02.md`.
4. Run Cursor Composer 2.5 with only the fresh Portolan artifacts allowed.
5. Save the with-Portolan output to
   `docs/specs/076-cursor-enterprise-parity-validation/stress/cursor-with-portolan-output-2026-06-02.md`.

## Scoring

1. Create `reviews/parity-scoring-ledger-2026-06-02.md`.
2. Score C1-C9 independently.
3. Keep C4 runtime topology `not_assessed` or `cannot_verify` unless spec 074
   produced runtime-visible health evidence.
4. Keep C6 full graph/callgraph `cannot_verify` unless a later graph producer
   slice supersedes spec 077.
5. Reject broad human/enterprise parity if any required criterion is not
   verified or explicitly excluded with reviewed rationale.

## Closeout

Run baseline checks:

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

Record review disposition, PR readiness closeout, GitHub check state, and merge
readiness separately. Do not use unqualified "ready" language.
