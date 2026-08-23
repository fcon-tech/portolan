## Purpose

Defines the Chart (the Padrón): the living tech-design artifact a
Cartographer expedition writes inside the surveyed target — its location,
its two layers (human-readable sheets and a machine index), the mandatory
anchor and trust-label contract, staleness as pending correction, and the
Notices to Mariners change report.

## ADDED Requirements

### Requirement: Chart lives inside the target
The Chart SHALL be stored under `<target>/.portolan/chart/` and nowhere
else. It SHALL consist of one markdown sheet per vessel plus a machine
index `index.jsonl`. No Expedition state may be written outside
`<target>/.portolan/`.

#### Scenario: First write creates the chart directory
- **WHEN** a Cartographer writes the first chart entry for a target with no
  existing chart
- **THEN** `<target>/.portolan/chart/` is created containing at least one
  sheet and a non-empty `index.jsonl`

#### Scenario: Writes stay inside the perimeter
- **WHEN** any chart operation runs against a target
- **THEN** no file is created or modified outside `<target>/.portolan/`

### Requirement: Every entry carries anchors and a trust label
Every chart entry — vessel, fairway, port of entry, beacon, light, danger —
SHALL carry at least one anchor (a file path with optional line reference,
a manifest key, or a receipt id) and exactly one trust label. The store
MUST reject a write that omits either.

#### Scenario: Entry without an anchor is rejected
- **WHEN** a write attempts to store a fairway with a trust label but no
  anchors
- **THEN** the write is rejected with an error naming the offending entry
  and nothing is persisted

#### Scenario: Entry without a trust label is rejected
- **WHEN** a write attempts to store a vessel with anchors but no trust
  label
- **THEN** the write is rejected with an error naming the offending entry
  and nothing is persisted

### Requirement: Trust vocabulary is closed and honest
The trust label SHALL be one of `measured`, `charted`, `reported`,
`doubtful`, `unsurveyed`. An entry with no usable evidence MUST be labeled
`unsurveyed`; the Chart MUST NOT present missing evidence under a stronger
label.

#### Scenario: Unknown label is rejected
- **WHEN** a write uses a label outside the five-value vocabulary
- **THEN** the write is rejected and the accepted values are listed in the
  error

#### Scenario: Absence stays visible
- **WHEN** a vessel has no determinable runtime behavior
- **THEN** its sheet marks that aspect `unsurveyed` instead of omitting it

### Requirement: Staleness is pending correction
The Chart SHALL record a source signature per vessel. When files under a
vessel change after it was last surveyed, the affected entries MUST be
marked `pending correction`; entries whose sources are unchanged MUST NOT
be marked. A later expedition repairs marked entries.

#### Scenario: Editing a file flips only its vessel
- **WHEN** a source file belonging to one vessel changes after the chart
  was written
- **THEN** that vessel's entries are marked `pending correction` and no
  other vessel's entries are

#### Scenario: Unchanged sources stay fresh
- **WHEN** the chart is re-opened with no source changes
- **THEN** no entry is marked `pending correction`

### Requirement: Corrections are reported as Notices to Mariners
After an expedition modifies or repairs chart entries, the Chart SHALL
produce a Notices to Mariners report listing what changed (added, corrected,
marked stale, retired) with anchors. The report MUST be plain text suitable
for a git diff review.

#### Scenario: Repair produces a notice
- **WHEN** an expedition repairs an entry previously marked
  `pending correction`
- **THEN** a notice names the entry, the correction, and its anchor

### Requirement: Chart writes are atomic
A chart write SHALL either persist completely (sheets and index together)
or leave the previous chart untouched. A partially written chart MUST NOT
be observable.

#### Scenario: Interrupted write leaves the old chart
- **WHEN** a write fails partway (for example, an invalid entry is found
  late in the batch)
- **THEN** the chart on disk is byte-identical to its state before the
  write began
