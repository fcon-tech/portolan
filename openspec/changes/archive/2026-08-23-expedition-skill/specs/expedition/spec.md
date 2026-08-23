## Purpose

Defines how a Portolan expedition behaves end to end: the one-phrase launch
the Governor gives, the single approval it asks, the survey method the
skill teaches, the verify loop that keeps the Chart honest, and the Sailing
Directions that come back.

## ADDED Requirements

### Requirement: One phrase launches the expedition
The Governor SHALL be able to launch a first run with a single phrase
asking to survey a target with Portolan. The Cartographer SHALL then
perform everything else unaided — install the skill and the MCP server into
its harness, obtain the approval, run the expedition, and deliver Sailing
Directions — without presenting commands for the Governor to copy or
execute.

#### Scenario: A phrase is the whole lift-off
- **WHEN** the Governor writes one phrase asking to survey a target with
  Portolan
- **THEN** the Cartographer proceeds through install, approval, survey, and
  brief without any further Governor action

#### Scenario: Zero copied commands
- **WHEN** any step of the first run would otherwise need a shell command
  from the Governor
- **THEN** the Cartographer performs it itself, and the Governor is shown
  no command text to copy

### Requirement: One approval guards network and installation
The expedition SHALL ask exactly one explicit approval per session,
covering network access and external tool installation, and SHALL ask it
before any network access or installation occurs. Running the target's
builds and tests SHALL require no further approval. The expedition SHALL
write only under `<target>/.portolan/` and SHALL never request, perform, or
propose mutation of the target's source.

#### Scenario: One prompt, then work
- **WHEN** the first run begins
- **THEN** the Governor receives exactly one approval request covering
  network access and tool installation, and no further approval requests
  during the session

#### Scenario: Builds run unbothered
- **WHEN** the expedition needs to build or test the target to learn its
  behavior
- **THEN** it runs those builds and tests without asking the Governor
  again, and receipts them in the ship's log

#### Scenario: The perimeter holds
- **WHEN** the expedition completes
- **THEN** every file it created or modified is under `<target>/.portolan/`
  and the target's source is byte-identical to before

### Requirement: The skill teaches a fixed survey order
The expedition skill SHALL teach one survey order: first identify the
vessels from manifests and entry points; then chart the fairways between
them; then record ports of entry and beacons; then chart the lights (API
contracts); then the dangers. Each pass SHALL write what it established
onto the Chart, so an interrupted expedition leaves a partial but valid
Chart rather than nothing.

#### Scenario: A fresh survey follows the order
- **WHEN** the Cartographer surveys a target with no existing Chart
- **THEN** its passes run vessels, fairways, ports of entry and beacons,
  lights, dangers — in that order, each writing charted entries

#### Scenario: An interrupted expedition leaves a valid partial Chart
- **WHEN** an expedition is cut short mid-survey
- **THEN** the passes that completed are present on the Chart with their
  anchors and trust labels, and the untouched waters are marked
  `unsurveyed`

### Requirement: The survey verifies as it charts
The skill SHALL teach the Cartographer to verify its assertions with
soundings — `sound.edge` for asserted fairways, `sound.anchor` for cited
anchors — and to let the verdict inform the entry. A refuted assertion
MUST be corrected or downgraded (for example to `doubtful`) rather than
left standing as written.

#### Scenario: Fairways are sounded before they stand
- **WHEN** the Cartographer asserts a fairway between two vessels
- **THEN** it sounds that fairway and records the outcome before or with
  the write, and the entry reflects the verdict

#### Scenario: Refutations are repaired, not ignored
- **WHEN** a sounding refutes an anchor or fails to confirm a fairway
- **THEN** the Cartographer corrects the entry or lowers its trust label in
  the same expedition

### Requirement: Unsurveyed waters stay unsurveyed
The expedition SHALL mark what it could not determine as `unsurveyed` —
including runtime topology, deployed versions, and behavior only observable
at run time — and SHALL NOT guess under a stronger label. The Sailing
Directions SHALL state the principal unsurveyed waters.

#### Scenario: The static limit is admitted
- **WHEN** the expedition cannot determine a fact statically
- **THEN** the Chart marks it `unsurveyed` instead of presenting an
  inference as evidence

#### Scenario: The brief says what was not learned
- **WHEN** Sailing Directions are delivered
- **THEN** they name the expedition's principal unsurveyed waters

### Requirement: Sailing Directions are the deliverable
The expedition SHALL conclude by delivering Sailing Directions to the
Governor: the top findings on structure, risks, and smells — each with its
anchors and trust label — plus where the Chart lives. No claim in the brief
SHALL appear without an anchor and a trust label.

#### Scenario: The brief is complete
- **WHEN** the expedition completes
- **THEN** the delivered brief lists top findings each carrying anchors and
  a trust label, states the Chart's location under the target, and names
  the unsurveyed waters

#### Scenario: Unanchored claims do not ship
- **WHEN** a finding cannot be anchored
- **THEN** it is excluded from the brief or explicitly labeled
  `unsurveyed`, never presented as an established fact

### Requirement: Later expeditions correct, not redraw
A subsequent expedition SHALL begin from the existing Chart: repair entries
marked `pending correction`, extend rather than replace what stands, and
report its changes as Notices to Mariners. The Chart SHALL survive across
sessions.

#### Scenario: A second run repairs the Chart
- **WHEN** a source change has marked entries `pending correction` and a
  new expedition runs
- **THEN** it repairs those entries and reports the repairs as Notices to
  Mariners, leaving the rest of the Chart intact

#### Scenario: The Chart outlives the session
- **WHEN** the Governor returns in a later session and asks about the
  surveyed target
- **THEN** the Cartographer answers from the surviving Chart instead of
  resurveying from nothing
