# formats Specification

## Purpose
The formats are Portolan's interface bet: the data model (anchors, trust
labels, receipts, staleness) made adoptable by consumers outside the server.
This capability defines the named formats, their versioning policy and
stability promise, and the rule that any export renders charted truth only.

## Requirements

### Requirement: The formats are named and versioned
Four formats SHALL be defined, each by a JSON Schema file carrying a
`version` field and a stable `$id`: the chart entry format, the trust
vocabulary, the ship's-log receipt format, and the adjacency graph export
format. The schema files SHALL be the single source of these contracts:
`index.jsonl` entries SHALL validate against the chart entry schema, every
line of `log.jsonl` SHALL validate against the receipt schema, and the
trust vocabulary SHALL enumerate exactly the five closed labels (measured,
charted, reported, doubtful, unsurveyed).

#### Scenario: Schemas validate the province's real data
- **WHEN** the chart entry schema is applied to every entry of a surveyed
  province's `index.jsonl` and the receipt schema to every line of its
  `log.jsonl`
- **THEN** every entry and every line validates with no errors

#### Scenario: The trust vocabulary is closed
- **WHEN** the trust vocabulary schema is applied to the trust label of any
  chart entry
- **THEN** it accepts exactly the five closed labels and rejects any other
  value

#### Scenario: A format file is self-identifying
- **WHEN** any of the four schema files is read
- **THEN** it carries a `version` field and an `$id`, and the `$id` is not
  a function of the version

### Requirement: Formats version by semver from 0.1.0
Each format SHALL start at version `0.1.0` and follow semver: while the
major is 0, a breaking change SHALL bump the minor and an additive change
SHALL bump the patch. The version SHALL live only in the schema file;
data files SHALL NOT carry a format version. Declaring `1.0.0` SHALL be a
separate Governor's decision, recorded when made.

#### Scenario: Breaking and additive changes move the version differently
- **WHEN** a schema change removes or redefines an existing field, versus
  one that only adds an optional field
- **THEN** the former bumps the minor (0.1.0 → 0.2.0) and the latter bumps
  the patch (0.1.0 → 0.1.1), and the format's documentation page names the
  new version and the migration consequence

### Requirement: Every format is documented for adoption
Each format SHALL be documented in the repository — on the formats page or
in its own dedicated section — stating its purpose, the schema file path,
the current version, and the stability promise (the versioning policy).
The documentation SHALL be the entry point an external consumer reads
without reading Portolan's source.

#### Scenario: A consumer finds the contract without the source
- **WHEN** an external consumer reads the formats documentation
- **THEN** each format section names the schema file, the current version,
  and the versioning policy, and no section requires knowledge of core
  internals

### Requirement: The adjacency export renders charted truth only
The adjacency graph export SHALL be derived from the Chart's machine layer
only — vessels, typed fairways, ports of entry, beacons, lights, dangers,
their anchors, trust labels, and staleness. It SHALL NOT invent, decorate,
or re-grade: every node and edge SHALL carry the trust label and anchors of
the entries it renders, and stale entries SHALL be marked pending
correction. What is not in the Chart SHALL NOT appear in the export.

#### Scenario: The export mirrors the Chart
- **WHEN** the export is produced for a province whose chart holds vessels,
  fairways with anchors and trust labels, and stale entries
- **THEN** every exported node and edge carries the anchors, trust label,
  and staleness of its chart entry, and nothing appears in the export that
  has no charted counterpart

#### Scenario: Unsurveyed stays unsurveyed
- **WHEN** the export is produced for a province with `doubtful` and
  `unsurveyed` markers
- **THEN** those markers are carried as-is and no export value upgrades
  them

### Requirement: The export is consumable without the MCP server
The adjacency export document SHALL be obtainable without running the MCP
server and SHALL self-describe: it names its format and its schema version.
A consumer holding only the schemas and the documentation SHALL be able to
validate the document without importing anything from Portolan's source.

#### Scenario: A non-MCP consumer obtains and validates the export
- **WHEN** the export is written through the command-line interface and
  validated against the graph export schema alone
- **THEN** the document validates, and its self-description names the
  format and the schema version it was produced against
