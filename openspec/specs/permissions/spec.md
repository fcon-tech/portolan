# permissions Specification

## Purpose
Defines the perimeter a Portolan expedition never crosses: the one
approval a session may ask, the only directory anything may be written to,
and the rule that a province read — however it is cited — never resolves
outside the target.

## Requirements

### Requirement: One approval per session
Network access and external tool installation SHALL be covered by exactly
one explicit approval per session, asked before either occurs. After the
approval, running the target's builds and tests SHALL NOT be asked about
again. Nothing SHALL access the network or install a tool before the
approval.

#### Scenario: The one approval covers the session
- **WHEN** the Cartographer asks the approval before any network access or
  installation, and the Governor approves
- **THEN** the expedition installs, runs the target's builds and tests, and
  completes without asking a second approval

#### Scenario: Nothing precedes the approval
- **WHEN** any step would need the network or an external tool installation
- **THEN** that step waits until the one approval is given, and a refusal
  stops the expedition instead of improvising a substitute

### Requirement: Writes stay under the province
Every file Portolan writes SHALL land under `<target>/.portolan/`: the
Chart, the ship's log, the harbor snapshot and history, the Sailing
Directions archive, and the Chart Room export. The target's own sources
SHALL never be mutated: Portolan is a reader, not a surgeon. A needed
source change is charted as a danger with an anchor, never performed or
proposed as an edit.

#### Scenario: A survey mutates nothing but its own waters
- **WHEN** an expedition charts, receipts, renders, or archives anything
- **THEN** every written path resolves under `<target>/.portolan/`, and the
  target's tracked sources are byte-identical before and after

#### Scenario: A needed source change is charted, not made
- **WHEN** a survey establishes that the target needs a source change
- **THEN** the expedition charts a danger carrying an anchor to the lines
  that exhibit the need, and performs no edit

### Requirement: Province reads never cross the perimeter
Every file read (an anchor sounding, a manifest read, a staleness walk, a
vessel-local discovery) SHALL resolve inside the target root, both
lexically and through symlinks. A cited path that escapes (`..` segments,
an in-target symlink pointing outside, an absolute path elsewhere) SHALL be
reported or refuted as such and SHALL NOT be read. A charted vessel whose
paths cannot be proven inside the province SHALL never be vouched as fresh.

#### Scenario: An escaping citation is refused, not read
- **WHEN** a chart entry or tool argument cites a path that resolves outside
  the target root
- **THEN** the read is reported as escaping (or the sounding comes back
  refuted) with nothing outside the province disclosed

#### Scenario: A symlinked vessel root is never provably fresh
- **WHEN** a charted vessel's top-level path is a symlink
- **THEN** the vessel counts as pending correction rather than signing
  metadata the province never surveyed
