## MODIFIED Requirements

### Requirement: Proposals are computed, not imagined
The `expeditions.propose` operation SHALL build its queue from exactly
three deterministic inputs: chart entries marked `pending correction`;
recorded gaps (vessels with no recorded behavior, vessels with no charted
light); and landscape changes since the last survey snapshot. Drift SHALL
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
entries affected. A province with no drift, no gap, and no landscape
change SHALL produce an empty queue.

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
- **WHEN** the chart is fresh, no gaps are recorded, and the landscape is
  unchanged since the last survey snapshot
- **THEN** the queue is empty and no expedition is proposed

### Requirement: Auto-repair is bounded and never curious
The night policy SHALL auto-execute only `repair` proposals, and only
when the setting `harbor.auto_repair_max_vessels` is present and
positive; absent or zero SHALL mean report-only. One watch run SHALL
auto-execute repair proposals in queue order — highest-ranked first —
until the bound's vessel count is spent; a launch attempt spends the
bound whether or not the launch succeeds, and repair proposals past the
bound SHALL stay pending, listed with their evidence. `new-land` and
`gap` proposals SHALL never be auto-executed regardless of the bound.

#### Scenario: Within the bound, repair runs
- **WHEN** three vessels drift, each holding its own repair proposal, and
  the bound is three
- **THEN** all three repair proposals launch, in queue order

#### Scenario: Beyond the bound stays a proposal
- **WHEN** five vessels drift and the bound is three
- **THEN** the three highest-ranked repair proposals launch, and the work
  past the bound stays a proposal: the two lowest-ranked rows are listed
  with their evidence for the Governor's decision

#### Scenario: New land is never auto-explored
- **WHEN** the only proposal is new-land and the bound is high
- **THEN** nothing is launched and the report lists it as pending

## ADDED Requirements

### Requirement: The repair queue is fan-in ranked
Repair proposals SHALL be ordered among themselves by direct charted
fan-in — the count of charted fairways whose target vessel is this
vessel and whose source vessel is a different vessel — highest first,
ties broken by vessel id. This is deliberately not the neighborhood's
fan-in: `chart.neighborhood` counts every charted incoming fairway per
entry, while the queue's rank is cross-vessel per vessel and excludes a
vessel's fairways to itself. The ranking SHALL be arithmetic over
charted bytes only: no timestamps and no model judgment participate, and
two computations over an unchanged chart SHALL order the repair rows
identically. A drifted vessel with no incoming cross-vessel fairway SHALL
still be proposed, ranked by the tie-break alone.

#### Scenario: The hub outranks the leaf
- **WHEN** two vessels are pending correction, one carrying fan-in 11 and
  the other fan-in 1
- **THEN** the hub's repair proposal precedes the leaf's in the queue

#### Scenario: A detached vessel is proposed, not dropped
- **WHEN** a drifted vessel has no charted incoming fairways
- **THEN** its repair proposal stands among the ties, ordered by vessel
  id, and is never dropped from the queue

#### Scenario: The order is deterministic
- **WHEN** proposals are computed twice over an unchanged province
- **THEN** the repair rows come back in the same order both times
