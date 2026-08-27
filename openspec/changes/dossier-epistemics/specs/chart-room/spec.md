## ADDED Requirements

### Requirement: The dossier carries an epistemic ledger
Each vessel dossier SHALL open with a four-lamp ledger — **OBSERVED**
(runtime: `behavior` present, or a receipt-type anchor on the vessel's
own entries), **VERIFIED** (trust `measured`), **DECLARED** (trust
`charted`), **CLAIMED** (trust `reported` or `doubtful`) — each counting
that vessel's associated entries, with a one-line footnote mapping the
lamps to the trust vocabulary. The briefing panel SHALL be at least 520px
wide. All counts SHALL derive arithmetically from embedded fields only.

#### Scenario: A hub's ledger separates its evidence tiers
- **WHEN** the dossier of a vessel with measured and charted entries is
  opened
- **THEN** VERIFIED and DECLARED show distinct non-zero counts taken from
  those entries, and the footnote names the mapping

#### Scenario: Observed needs a receipt or it is not observed
- **WHEN** no receipt anchor backs the vessel's behavior or entries
- **THEN** OBSERVED reads zero/absent with the unsurveyed statement, even
  when other lamps are high

#### Scenario: Claims name their carriers
- **WHEN** any entry of the vessel carries reported or doubtful trust
- **THEN** CLAIMED lists each such kind/id instead of a bare count

#### Scenario: Sounded verdicts ride their fairway rows
- **WHEN** a stored fairway note records a sounded verdict
- **THEN** the corresponding fairway row shows it in the dossier
