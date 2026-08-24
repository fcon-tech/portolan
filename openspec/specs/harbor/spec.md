# harbor Specification

## Purpose
Defines the Harbor Master: how Portolan itself proposes expeditions. A
deterministic engine turns the live Chart's state — drift, recorded gaps,
and landscape changes since the last survey — into a ranked queue of
expedition proposals, each with evidence anchors and a scope estimate,
surfaced in chat, with decisions recorded and refusals respected.

## Requirements

### Requirement: Proposals are computed, not imagined
The `expeditions.propose` operation SHALL build its queue from exactly
three deterministic inputs: chart entries marked `pending correction`;
recorded gaps (vessels with no recorded behavior, vessels with no charted
light); and landscape changes since the last survey snapshot. Each
proposal SHALL carry its kind (repair, gap, new-land), the evidence
anchors that justify it, and a scope estimate naming the vessels and
entries affected. A province with no drift, no gap, and no landscape
change SHALL produce an empty queue.

#### Scenario: Drift becomes a repair proposal
- **WHEN** source changes have marked vessels `pending correction` and
  proposals are computed
- **THEN** a repair proposal lists those vessels with anchors to the
  changed files and estimates the entries and soundings it would touch

#### Scenario: A gap becomes a survey proposal
- **WHEN** a charted vessel has no recorded behavior and no charted light
- **THEN** a gap proposal names that vessel and the missing passes

#### Scenario: A still province proposes nothing
- **WHEN** the chart is fresh, no gaps are recorded, and the landscape is
  unchanged since the last survey snapshot
- **THEN** the queue is empty and no expedition is proposed

### Requirement: The snapshot tracks the last survey
The Harbor Master SHALL keep a landscape snapshot — the repositories and
manifests present — together with the chart index hash it was taken
against. The snapshot SHALL refresh when the chart index hash changes
(a new survey stood); a landscape entry absent from the snapshot SHALL
yield a new-land proposal naming it.

#### Scenario: A new repository is proposed
- **WHEN** a repository directory exists in the province but not in the
  last-survey snapshot and the chart is unchanged
- **THEN** a new-land proposal names that repository with an anchor to it

#### Scenario: A survey refreshes the snapshot
- **WHEN** the chart index hash changes after an expedition
- **THEN** the snapshot refreshes to the current landscape and entries the
  previous snapshot already covered produce no new-land proposals

### Requirement: Decisions are recorded and refusals respected
Every proposal SHALL carry a stable fingerprint of its kind and evidence.
The `expeditions.decide` operation SHALL append the Governor's decision —
accepted or declined — to an append-only history under
`<target>/.portolan/harbor/`. A proposal whose fingerprint was declined
SHALL NOT be proposed again while its evidence is unchanged; it SHALL
reappear when its evidence fingerprint changes.

#### Scenario: A refusal holds while evidence is unchanged
- **WHEN** a proposal was declined and the same drift is recomputed
- **THEN** the queue does not contain that proposal again

#### Scenario: Changed evidence reopens the proposal
- **WHEN** a declined repair proposal's drift grows to more vessels
- **THEN** the new fingerprint is proposed again with the wider evidence

### Requirement: The queue surfaces in chat at session start
The expedition skill SHALL teach the Cartographer to compute the queue
when a session enters a province with a standing Chart, and to present
the top proposals — kind, evidence summary, scope — in one chat message
before other work. Acceptance SHALL be one phrase; the resulting decision
SHALL be recorded through `expeditions.decide`. An empty queue SHALL
produce no message.

#### Scenario: Proposals greet the Governor
- **WHEN** a session starts in a province whose queue is non-empty
- **THEN** the Cartographer's first substantive message presents the top
  proposals with their evidence summaries and asks for a one-phrase
  decision

#### Scenario: Silence on a still province
- **WHEN** a session starts in a province whose queue is empty
- **THEN** the Cartographer proposes nothing and proceeds with the
  Governor's ask

### Requirement: Scheduling is an explicit setting, off by default
Harbor scheduling SHALL live in a settings file under
`<target>/.portolan/` and SHALL be unset by default; with no setting,
proposal computation runs only when invoked. Portolan SHALL ship no
daemon: a headless propose command SHALL exist for any external
scheduler, and its chat-formatted output SHALL be suitable for posting
as-is. When a schedule is configured, running the headless command
outside its cadence SHALL change nothing about the queue's contents.

#### Scenario: Default settings run nothing on their own
- **WHEN** no harbor schedule is configured
- **THEN** proposals are computed only when a session or a command asks
  for them

#### Scenario: A scheduled run yields the same queue
- **WHEN** the headless propose command runs twice over an unchanged
  province
- **THEN** both runs emit the same chat-formatted queue

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
- **THEN** the history records the attempt and its launch-failure (the
  failure is the latest word — the proposal is effectively not accepted),
  the failure is named in the report, and the proposal remains queued

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
