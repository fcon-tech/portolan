# Hypothesis Ledger: Root Discovery Bigtop Smoke

Date: 2026-05-26

## Hypothesis

- ID: H4
- Claim: Portolan can remove the prepared `selection.json` precondition for a
  CTO/agent first pass over a local multi-repo ecosystem.
- Target: `/home/fall_out_bug/projects/bigtop-landscape`
- Command output: `/tmp/portolan-017-bigtop-root-map`

## Evidence

`portolan map --root /home/fall_out_bug/projects/bigtop-landscape --out
/tmp/portolan-017-bigtop-root-map --force` completed without passing
`selection.json`.

`coverage.json` recorded:

- 18 repository records with `status: visible`
- 18 repository records with `evidence_state: source-visible`
- `external-completeness` with `status: unknown`
- `external-completeness` with `evidence_state: unknown`
- repository-discovery gaps for local non-repository inputs

## Result

The prepared-selection precondition is removed for local root mapping. This is
not a full blind Cursor/Composer acceptance run, and it does not prove the local
Bigtop checkout set is complete.

## Classification

| Claim | Classification | Notes |
| --- | --- | --- |
| Root mapping can operate without `selection.json`. | `verified` for local Bigtop root smoke | The command used only `--root` and `--out`. |
| The local checkout set is externally complete. | `unknown` | No manifest was supplied for this root run. |
| Cursor/Composer can complete the blind protocol unaided. | `not_assessed` | No Cursor/Composer transcript was produced in this smoke. |
