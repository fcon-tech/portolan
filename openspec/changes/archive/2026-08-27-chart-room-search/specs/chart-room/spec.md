## ADDED Requirements

### Requirement: The reader can focus without hiding
The Chart Room top bar SHALL offer a find field matching vessel ids and
display names case-insensitively (best match: exact id, then prefix, then
substring; the best match is selected with its dossier), per-trust filter
chips, and a dangers-only chip. Filtering SHALL only dim non-matching
vessels in both representations — dimmed vessels keep their labels and
stay clickable — and SHALL never remove data from the page. A visible
state indicator SHALL show active filters with a one-click reset; a fresh
export always opens unfiltered.

#### Scenario: Find by name fragment selects and opens the dossier
- **WHEN** "zoo" is typed into the find field on the Bigtop export
- **THEN** zookeeper is selected, its dossier opens, and its impact set is
  highlighted

#### Scenario: A trust chip dims the rest but hides nothing
- **WHEN** only `measured` is active among trust chips
- **THEN** vessels whose records are measured render at full attention,
  all others are dimmed but remain labeled and clickable

#### Scenario: Dangers-only focuses risk carriers
- **WHEN** the dangers-only chip is toggled on
- **THEN** vessels carrying at least one danger stay bright and clean
  waters dim in both representations

#### Scenario: Reset restores full attention
- **WHEN** any combination of filters is active and reset is pressed
- **THEN** every vessel returns to normal rendering
