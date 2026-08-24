## Purpose

Defines the Harbor Master: how Portolan itself proposes expeditions. A
deterministic engine turns the live Chart's state — drift, recorded gaps,
and landscape changes since the last survey — into a ranked queue of
expedition proposals, each with evidence anchors and a scope estimate,
surfaced in chat, with decisions recorded and refusals respected.

## ADDED Requirements

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
