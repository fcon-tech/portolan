## MODIFIED Requirements

### Requirement: Sailing Directions are the deliverable
The expedition SHALL conclude by delivering Sailing Directions to the
Governor: the top findings on structure, risks, and smells — each with its
anchors and trust label — plus where the Chart lives, plus a verification
summary produced by calling the `trust.report` tool (trust-label
distribution, pending-correction state, and the refuted-anchor list, or the
confirmation that no anchor was refuted). No claim in the brief SHALL appear
without an anchor and a trust label.

#### Scenario: The brief is complete
- **WHEN** the expedition completes
- **THEN** the delivered brief lists top findings each carrying anchors and
  a trust label, states the Chart's location under the target, names the
  unsurveyed waters, and includes the verification summary from
  `trust.report`

#### Scenario: The verification summary reports broken anchors honestly
- **WHEN** `trust.report` returns refuted anchors for the surveyed chart
- **THEN** the brief names the refuted entries and their anchors instead of
  reporting only the confirmed counts

#### Scenario: Unanchored claims do not ship
- **WHEN** a finding cannot be anchored
- **THEN** it is excluded from the brief or explicitly labeled
  `unsurveyed`, never presented as an established fact
