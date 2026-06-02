# Cursor Enterprise Parity Prompt

Target: `/home/fall_out_bug/projects/bigtop-landscape`

Model/lane: Cursor Composer 2.5

Date note: this file name is the planning-branch prompt name. If execution
happens later, record the actual run id and output paths in the lane ledger.

## Shared Task

Assess whether the local Apache Bigtop landscape can be explained at the level
expected from a senior human architect or enterprise code-intelligence system.

Answer with evidence, not confidence language. For every claim, name the local
file, Portolan artifact, or explicit gap state that supports it.

Score these criteria:

- C1: repository roles and landscape orientation
- C2: packaging and deployment role attribution
- C3: deployment/model understanding
- C4: runtime topology and service health
- C5: API/catalog/service surfaces
- C6: dependency, symbol/reference, and call graph understanding
- C7: duplication and technical-debt clues
- C8: evidence discipline and gap attribution
- C9: human/enterprise architecture parity

Use only these score values:

- `verified`
- `partial`
- `failed`
- `cannot_verify`
- `not_assessed`

Reject broad human/enterprise parity if any required criterion is not
`verified` or explicitly excluded with reviewed rationale.

## Baseline Lane Constraint

Do not read Portolan artifacts. Do not read prior `.portolan/stress/*` outputs
or old `run/` artifacts. Use only the local source landscape and
`selection.json`.

## With-Portolan Lane Constraint

Use only the fresh Portolan artifacts provided for this run. Do not read older
Portolan artifacts or prior stress reports unless the run ledger explicitly
allows them as evidence inputs.

## Required Output

1. Short architecture map.
2. C1-C9 scoring table.
3. Claims that are allowed.
4. Claims that remain `cannot_verify`, `not_assessed`, or rejected.
5. Evidence paths, forbidden-path audit notes, and a lane attestation stating
   whether any disallowed legacy Portolan artifact was read.
