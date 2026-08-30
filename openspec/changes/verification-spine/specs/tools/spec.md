## ADDED Requirements

### Requirement: trust.report aggregates the province's verification state
The `trust.report` tool SHALL return, in one call, the verification summary
of the province: the count of chart entries per trust label, the count per
entry kind, the staleness state (which vessels are pending correction and
how many entries each drags), and a ship's-log summary (total receipts and
the most recent receipt). The report SHALL refresh staleness first, exactly
as `chart.read` does, so the staleness section is never served from a stale
signature. The tool SHALL NOT create, modify, or remove any chart entry,
trust label, or file outside `<target>/.portolan/`.

#### Scenario: The report answers in one call
- **WHEN** the Cartographer calls `trust.report` against a charted province
- **THEN** the response carries the trust-label distribution, the per-kind
  counts, the pending-correction vessels with their entry counts, and the
  ship's-log summary

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

### Requirement: trust.report re-sounds anchors live
The report SHALL re-verify every chart anchor through the deterministic
`sound.anchor` machinery and state the outcome: how many anchors were
sounded, how many resolved `confirmed`, and how many `refuted` — listing
every refuted anchor with its entry id and the cited anchor. A refuted
anchor SHALL NOT silently change the entry or its trust label; the verdict
informs, the Cartographer writes.

#### Scenario: Every anchor is sounded
- **WHEN** `trust.report` runs against a charted province
- **THEN** every anchor on the chart was sounded and the report states the
  sounded count and the total as equal

#### Scenario: A broken anchor is named, not smoothed over
- **WHEN** an entry's anchor no longer resolves (file moved, content drifted,
  receipt id gone)
- **THEN** the report lists that entry id with the refuted anchor and what
  was actually found, and the entry on disk is unchanged

#### Scenario: Re-running over an unchanged province agrees
- **WHEN** `trust.report` runs twice over an unchanged province
- **THEN** both responses carry the same counts, the same verdicts, and the
  same refuted list in the same order
