## MODIFIED Requirements

### Requirement: Proposals are computed, not imagined
The `expeditions.propose` operation SHALL build its queue from exactly
four deterministic inputs: chart entries marked `pending correction`;
recorded gaps (vessels with no recorded behavior, vessels with no charted
light); landscape changes since the last survey snapshot; and open flares
— repair needs filed by expeditions as ship's-log receipts. Drift SHALL
propose one repair proposal per pending-correction vessel: the proposal
names that vessel alone, cites an anchor under its charted paths, and
estimates the entries and soundings re-surveying it would touch, charged
by the same attribution the staleness report uses. The repair proposal's
fingerprint evidence SHALL carry the vessel and its stale-entry count, so
a refusal holds while that drift is unchanged and reopens when the count
changes. A drifted vessel whose charted paths hold no soundable regular
file SHALL still be proposed, its anchor omitted — never faked. Each
proposal SHALL carry its kind (repair, gap, new-land), the evidence
anchors that justify it, and a scope estimate naming the vessels and
entries affected. A province with no drift, no gap, no landscape change,
and no open flare SHALL produce an empty queue.

#### Scenario: Drift becomes a repair proposal
- **WHEN** source changes have marked two vessels `pending correction`
  and proposals are computed
- **THEN** two repair proposals are computed, each naming one vessel with
  an anchor under that vessel's charted paths and the entries and
  soundings its re-survey would touch

#### Scenario: A declined vessel reopens when its drift changes
- **WHEN** a vessel's repair proposal was declined at three stale entries
  and its drift later grows to four
- **THEN** the proposal is computed again with the new evidence and may
  be decided anew

#### Scenario: A deleted coast is still proposed
- **WHEN** a drifted vessel's charted paths hold no soundable regular
  file
- **THEN** its repair proposal stands without anchors, naming the vessel,
  and no anchor is fabricated

#### Scenario: A gap becomes a survey proposal
- **WHEN** a charted vessel has no recorded behavior and no charted light
- **THEN** a gap proposal names that vessel and the missing passes

#### Scenario: A still province proposes nothing
- **WHEN** the chart is fresh, no gaps are recorded, the landscape is
  unchanged since the last survey snapshot, and no flare is open
- **THEN** the queue is empty and no expedition is proposed

#### Scenario: A vessel named by both drift and a flare yields one row
- **WHEN** a vessel is pending correction and an open flare names the
  same vessel
- **THEN** the queue carries one repair proposal for that vessel whose
  evidence carries both the drift and the flare's stated reason

### Requirement: The watch report is chat-formatted and deterministic
The watch SHALL emit one report listing what ran (with outcomes), what
was left pending (with evidence summaries), any launcher failures, and —
for each expedition it launched — the expedition's charter and whether
the expedition kept it, with any out-of-charter writes named — in a form
suitable for posting to chat as-is. A launch that filed no charter
receipt is reported against the latest charter on record. Two watch runs
over an unchanged province SHALL emit identical reports.

#### Scenario: The report is stable
- **WHEN** the watch command runs twice over an unchanged province
- **THEN** both reports are byte-identical

#### Scenario: Overreach is named, not summarized away
- **WHEN** a watch-launched expedition wrote chart entries outside its
  charter
- **THEN** the report lists those writes by vessel and count, alongside
  the charter they broke

## ADDED Requirements

### Requirement: A flare is filed, honored, and closed
An expedition finding a repair need outside its charter SHALL file a
flare: a ship's-log receipt naming the vessel, the stated reason, and the
evidence for the finding. Every open flare SHALL contribute a repair
proposal for the vessel it names, with the flare's reason as evidence. A
flare SHALL stay open until a decision on a repair proposal for its
vessel is recorded in the harbor history after the flare's receipt —
accepted or declined, either closes the flare. Flare-driven proposals
SHALL be repair rows for every other purpose — decided by the Governor
like any repair, and auto-executed by the watch within the same bound. No
new tool is served for flares: filing is a ship's-log receipt.

#### Scenario: A flare becomes a repair proposal
- **WHEN** an expedition files a flare naming vessel `B` with a stated
  reason and proposals are computed
- **THEN** the queue carries a repair proposal for vessel `B` whose
  evidence cites the flare's reason

#### Scenario: A decision closes the flare
- **WHEN** a repair proposal for a vessel named by an open flare is
  accepted or declined
- **THEN** the flare is closed and proposes nothing further

#### Scenario: An undecided flare keeps proposing
- **WHEN** an open flare names a vessel and no decision on a repair
  proposal for that vessel has been recorded after the flare's receipt
- **THEN** every computed queue carries the repair proposal for that
  vessel
