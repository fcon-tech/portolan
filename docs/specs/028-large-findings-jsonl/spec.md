# Feature Specification: Large Findings JSONL

**Feature Branch**: `028-large-findings-jsonl`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: A real, non-prepared run against
`/home/fall_out_bug/projects/vibe_coding` failed during `portolan map --root`
with `map: read findings: bufio.Scanner: token too long`.

## Requirements

- **FR-001**: Map artifact rendering MUST read valid JSONL findings whose
  individual line length exceeds `bufio.Scanner`'s default token limit.
- **FR-002**: The fix MUST preserve the JSONL contract: one JSON finding per
  non-empty line.
- **FR-003**: Invalid JSONL lines MUST still fail with a parse error.
- **FR-004**: The fix MUST NOT truncate finding summaries or silently skip large
  findings.
- **FR-005**: Product hypothesis ledgers MUST record the real target failure
  and the post-fix status.

## Success Criteria

- **SC-001**: A regression test proves `readFindings` accepts a finding line
  larger than 64 KiB.
- **SC-002**: `portolan map --root /home/fall_out_bug/projects/vibe_coding`
  no longer fails with `bufio.Scanner: token too long`.
- **SC-003**: Baseline checks pass.
