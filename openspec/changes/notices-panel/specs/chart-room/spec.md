## ADDED Requirements

### Requirement: The Chart Room surfaces the Notices to Mariners
The Chart Room SHALL embed the parsed content of the province's Notices to
Mariners (`<target>/.portolan/chart/notices.txt`) and list it in the
briefing panel: every notice's action (ADDED, CORRECTED, MARKED STALE,
RETIRED), entry key (`kind/id`), note when present, and anchors. A missing
or empty notices file SHALL render as a visible "no outstanding notices"
state, not an absent section. The file is read-only input; rendering SHALL
change no storage.

#### Scenario: Outstanding notices are listed
- **WHEN** the Chart Room is rendered for a province whose chart carries
  outstanding notices
- **THEN** the briefing panel lists each notice with its action label,
  entry key, note, and anchors

#### Scenario: No notices stay visible as empty
- **WHEN** the rendered province has an empty or absent `notices.txt`
- **THEN** the briefing panel shows an explicit no-outstanding-notices
  state in both representations

#### Scenario: Engineering mode renames the section, not the facts
- **WHEN** the engineering representation is active
- **THEN** the section title uses the change-log lexicon while action
  labels remain ADDED / CORRECTED / MARKED STALE / RETIRED
