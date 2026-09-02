## MODIFIED Requirements

### Requirement: trust.report aggregates the province's verification state
The `trust.report` tool SHALL return, in one call, the verification summary
of the province: the count of chart entries per trust label, the count per
entry kind, the staleness state (which vessels are pending correction and
how many entries each drags), and a ship's-log summary (total receipts and
the most recent receipt). The pending-correction vessels SHALL be listed
in the repair rank's order — direct charted fan-in highest first, ties by
vessel id. The report SHALL refresh staleness first, exactly
as `chart.read` does, so the staleness section is never served from a stale
signature. The tool SHALL NOT create, modify, or remove any chart entry,
trust label, or file outside `<target>/.portolan/`.

#### Scenario: The report answers in one call
- **WHEN** the Cartographer calls `trust.report` against a charted province
- **THEN** the response carries the trust-label distribution, the per-kind
  counts, the pending-correction vessels with their entry counts in the
  repair rank's order, and the ship's-log summary

#### Scenario: The pending-vessel list follows the queue order
- **WHEN** several vessels are pending correction with different fan-in
- **THEN** the pending-vessel list orders highest fan-in first with vessel
  id breaking ties, exactly as the repair rows are ordered in the queue

#### Scenario: The staleness section is fresh
- **WHEN** a vessel's sources changed after the last survey and
  `trust.report` is called
- **THEN** the response reflects the refreshed `pending correction` state,
  identical to what a `chart.read` would have marked

#### Scenario: The report writes nothing but the refresh
- **WHEN** `trust.report` runs against a province whose signatures are
  unchanged
- **THEN** the Chart on disk is byte-identical afterwards, and no file
  outside `<target>/.portolan/` was touched
