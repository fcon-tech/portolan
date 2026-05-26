# Verification: Cursor Comparison Validation

Date: 2026-05-26

## Baseline Checks

| Check | Status | Evidence |
| --- | --- | --- |
| `go test ./...` | `verified` | Passed for all packages |
| `jq empty schema/*.json` | `verified` | Passed |
| `git diff --check` | `verified` | Passed |

## Feature Checks

| Check | Status | Evidence |
| --- | --- | --- |
| Spec quality checklist | `verified` | `checklists/requirements.md`: 16 total, 16 complete, 0 incomplete |
| Functional requirement trace | `verified` | `comparison-ledger-2026-05-26.md`, `ledger-contract-check-2026-05-26.md`, and `implementation-disposition-2026-05-26.md` cover FR-001 through FR-010 |
| Fixed target exists | `verified` | `/home/fall_out_bug/projects/bigtop-landscape` exists and contains 18 repos under `repos/` |
| Context pack generation | `verified` | `/tmp/portolan-034-bigtop-context` written |
| Map bundle generation | `verified` | `/tmp/portolan-034-bigtop-map` written |
| Cursor-alone lane | `verified` | Raw output saved to `cursor-alone-output.md` |
| Cursor-plus-Portolan lane | `verified` | Raw output saved to `cursor-plus-portolan-output.md` |
| Ledger contract | `verified` | `ledger-contract-check-2026-05-26.md` |

## Not Assessed

- UI Cursor/Composer lane: `not_assessed`
- Full Apache Bigtop ecosystem completeness: `unknown`
- Runtime-visible service topology: `not_assessed`
- Near-clone and SBOM/component duplication: `not_assessed`
- OSS producer execution: `not_assessed`
