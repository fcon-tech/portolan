# Bigtop Selection Completeness Check

Date: 2026-05-27
Target: `/home/fall_out_bug/projects/bigtop-landscape/selection.json`
Output: `/tmp/portolan-bigtop-selection-completeness-20260527225644`
State: `verified` for curated manifest scope; not proof of global external
ecosystem completeness.

## Command

```bash
go run ./cmd/portolan map \
  --selection /home/fall_out_bug/projects/bigtop-landscape/selection.json \
  --out /tmp/portolan-bigtop-selection-completeness-20260527225644 \
  --force
```

Result: `verified`; command exited 0 and wrote a map bundle.

## Evidence

Coverage summary from `coverage.json`:

- total records: 44
- status `visible`: 32
- status `represented`: 12
- evidence `source-visible`: 31
- evidence `metadata-visible`: 13

Representative manifest-backed records:

- `manifest:apache-bigtop-release-350`: `metadata-visible`
- `manifest:apache-livy`: `source-visible`
- `manifest:apache-oozie`: `metadata-visible`
- `manifest:apache-sqoop`: `metadata-visible`
- `manifest:bigtop-ci`: `metadata-visible`
- `manifest:bigtop-binary-repos`: `metadata-visible`
- `manifest:bigtop-docker-images`: `metadata-visible`

Finding statuses from `summary.json`:

- 406 `observed`
- 103 `not_assessed`
- 6 `cannot_verify`
- 1 `unknown`

## Disposition

This run verifies that a curated Bigtop selection with
`require_full_corpus: true` and the local corpus manifest can represent the
manifest boundary in coverage artifacts. It does not prove complete external
ecosystem coverage outside that supplied manifest, and it does not make
runtime topology, near-clone duplication, semantic configuration, or unsupported
relationship surfaces verified.

Safe wording:

- "For the supplied Bigtop selection and corpus manifest, Portolan records the
  curated manifest scope as represented/visible coverage."

Unsafe wording:

- "Portolan proves complete Bigtop ecosystem coverage."
- "Portolan proves complete inherited-estate coverage from repository count."
