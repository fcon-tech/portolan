## ADDED Requirements

### Requirement: chart.export serves the adjacency export
The `chart.export` tool SHALL return the province's adjacency graph export:
a self-describing document (format name and schema version) whose nodes and
edges carry the anchors, trust labels, and staleness of their chart entries.
The tool SHALL NOT create, remove, or alter any chart entry and SHALL NOT
touch any file outside `<target>/.portolan/`; staleness metadata is
refreshed before serving exactly as `chart.read` refreshes it. Each
successful call SHALL record exactly one ship's-log receipt — a rejected
call SHALL record nothing. A province with no Chart SHALL produce an honest
error naming the absence, never a fabricated document.

#### Scenario: Export of a charted province is self-describing and truthful
- **WHEN** `chart.export` is called against a province with a charted Chart
- **THEN** the returned document names its format and schema version, and
  its nodes and edges carry the anchors, trust labels, and staleness of
  their chart entries

#### Scenario: Export writes nothing but its receipt
- **WHEN** `chart.export` runs against a province whose signatures are
  unchanged
- **THEN** the Chart on disk is byte-identical afterwards, no file outside
  `<target>/.portolan/` was touched, and the ship's log gained exactly one
  receipt naming the export call

#### Scenario: A drifted province's export is served fresh
- **WHEN** a vessel's sources changed after the last survey and
  `chart.export` is called
- **THEN** the document reflects the refreshed `pending correction` state,
  identical to what a `chart.read` would have marked

#### Scenario: Export of an uncharted province is an honest error
- **WHEN** `chart.export` is called against a target with no Chart
- **THEN** the tool returns an error naming the absent Chart and returns
  no document

### Requirement: chart.export truncates loudly
The export SHALL respect a byte budget. When the full document exceeds the
budget, the tool SHALL truncate and report the truncation loudly — naming
what was omitted (vessels and their counts) — and SHALL never cut silently.
When no honest cut remains — the fairways alone exceed the budget — the
tool SHALL refuse by name instead of serving over budget, returning no
document and writing no receipt.

#### Scenario: Oversized export reports what was cut
- **WHEN** the Chart holds more entries than the export budget admits
- **THEN** the returned document fits the budget and the tool reports the
  truncation, naming the vessels whose entries were omitted and their
  counts

#### Scenario: Chart within budget is returned whole
- **WHEN** the Chart's entry count and bytes fit the budget
- **THEN** the export contains every charted entry with no truncation
  report

#### Scenario: Fairways alone over budget refuse by name
- **WHEN** the fairways alone exceed the byte budget
- **THEN** the tool errors naming the budget and serves no document, and
  no receipt is written
