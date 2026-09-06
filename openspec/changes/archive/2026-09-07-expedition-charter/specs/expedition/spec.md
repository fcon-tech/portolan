## ADDED Requirements

### Requirement: An expedition declares a charter and keeps it
An expedition SHALL record its charter in the ship's log when it starts:
the vessels and entries it promises to touch. An expedition launched from
a harbor proposal SHALL take its charter from that proposal's scope. A
repair need the expedition finds outside its charter SHALL be filed as a
flare, never fixed silently; when the expedition does write outside its
charter anyway, the writes stay receipted and surface as overreach in the
watch report and `trust.report` — writes are not blocked, but a broken
charter is never invisible. An expedition SHALL close its charter with an
outcome receipt when it ends.

#### Scenario: The charter is on record before work begins
- **WHEN** an expedition starts, launched from an accepted repair
  proposal for one vessel
- **THEN** its charter receipt names that vessel's scope from the
  proposal before the first chart write

#### Scenario: An out-of-charter need becomes a flare
- **WHEN** the expedition finds a repair need in a vessel its charter
  does not name
- **THEN** it files a flare for that vessel and leaves the entry
  untouched

#### Scenario: A broken charter is visible, not silent
- **WHEN** an expedition wrote entries outside its charter and the run is
  reported
- **THEN** the overreach is listed by vessel and entry count in the watch
  report and in `trust.report`
