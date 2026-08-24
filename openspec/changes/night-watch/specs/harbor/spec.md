## ADDED Requirements

### Requirement: The night watch acts only on invocation
The harbor watch command SHALL, when invoked against a province, compute
the standing queue, apply the night policy, launch what qualifies, and
emit one chat-formatted watch report. Portolan SHALL still ship no daemon:
the watch runs only when an external scheduler or a human invokes it.

#### Scenario: An invoked watch reports and acts
- **WHEN** the watch command runs against a province with drift within the
  auto-repair bound
- **THEN** the repair expedition is launched and the report names what ran

#### Scenario: An unchanged province needs no watch action
- **WHEN** the watch command runs twice and the first run's repair stood
- **THEN** the second run's report shows an empty acted-upon section and
  launches nothing

### Requirement: Auto-repair is bounded and never curious
The night policy SHALL auto-execute only `repair` proposals, and only
when the setting `auto_repair_max_vessels` is present and the proposal's
affected vessel count is within it; absent or zero SHALL mean
report-only. `new-land` and `gap` proposals SHALL never be auto-executed
regardless of the bound.

#### Scenario: Within the bound, repair runs
- **WHEN** two vessels drift and the bound is three
- **THEN** the repair proposal is launched automatically

#### Scenario: Beyond the bound stays a proposal
- **WHEN** five vessels drift and the bound is three
- **THEN** nothing is launched and the report lists the proposal as
  pending the Governor's decision

#### Scenario: New land is never auto-explored
- **WHEN** the only proposal is new-land and the bound is high
- **THEN** nothing is launched and the report lists it as pending

### Requirement: The launcher is external and swappable
The watch SHALL launch expeditions through an external launcher command
it does not own; the core SHALL know no harness. A launcher failure or
timeout SHALL leave the proposal pending, record the failure in the
harbor history, and name it in the report.

#### Scenario: A failing launcher fails loudly and harmlessly
- **WHEN** the launcher exits non-zero
- **THEN** no decision is recorded as accepted, the failure is appended to
  the history and named in the report, and the proposal remains queued

#### Scenario: The opencode adapter ships a working launcher
- **WHEN** the adapter's launcher is invoked for a repair proposal
- **THEN** it runs the Cartographer headlessly against the province and
  exits zero only when the expedition completed

### Requirement: Night actions are recorded
Every auto-executed launch SHALL be recorded in the harbor history with
its decision attributed to the night watch, and the launched expedition
SHALL leave its own receipts in the ship's log as any expedition does.
After a successful repair, the repaired fingerprint SHALL leave the queue.

#### Scenario: A night repair is attributable
- **WHEN** a night-watch repair completes
- **THEN** the history shows the acceptance attributed to the night watch
  and the next queue computation no longer contains that fingerprint

### Requirement: The watch report is chat-formatted and deterministic
The watch SHALL emit one report listing what ran (with outcomes), what
was left pending (with evidence summaries), and any launcher failures —
in a form suitable for posting to chat as-is. Two watch runs over an
unchanged province SHALL emit identical reports.

#### Scenario: The report is stable
- **WHEN** the watch command runs twice over an unchanged province
- **THEN** both reports are byte-identical
