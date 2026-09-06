## ADDED Requirements

### Requirement: chart.export serves the adjacency export
The `chart.export` tool SHALL return the province's adjacency graph export:
a self-describing document (format name and schema version) whose nodes and
edges carry the anchors, trust labels, and staleness of their chart entries.
The tool SHALL be read-only — it SHALL leave the Chart byte-identical —
and SHALL record exactly one ship's-log receipt per call. A province with
no Chart SHALL produce an honest error naming the absence, never a
fabricated document.

#### Scenario: Export of a charted province is self-describing and truthful
- **WHEN** `chart.export` is called against a province with a charted Chart
- **THEN** the returned document names its format and schema version, and
  its nodes and edges carry the anchors, trust labels, and staleness of
  their chart entries

#### Scenario: Export leaves no trace on the Chart
- **WHEN** `chart.export` is called and the Chart's files are compared
  before and after
- **THEN** no chart file changed, and the ship's log gained exactly one
  receipt naming the export call

#### Scenario: Export of an uncharted province is an honest error
- **WHEN** `chart.export` is called against a target with no Chart
- **THEN** the tool returns an error naming the absent Chart and returns
  no document

### Requirement: chart.export truncates loudly
The export SHALL respect a byte budget. When the full document exceeds the
budget, the tool SHALL truncate and report the truncation loudly — naming
what was omitted (vessels and their counts) — and SHALL never cut silently.

#### Scenario: Oversized export reports what was cut
- **WHEN** the Chart holds more entries than the export budget admits
- **THEN** the returned document fits the budget and the tool reports the
  truncation, naming the vessels whose entries were omitted and their
  counts

#### Scenario: Chart within budget is returned whole
- **WHEN** the Chart's entry count and bytes fit the budget
- **THEN** the export contains every charted entry with no truncation
  report
