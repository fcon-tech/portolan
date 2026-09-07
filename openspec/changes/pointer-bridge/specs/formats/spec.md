# formats Specification

## Purpose

The formats are Portolan's interface bet: the data model (anchors, trust
labels, receipts, staleness) made adoptable by consumers outside the server.
This capability defines the named formats, their versioning policy and
stability promise, and the rule that any export renders charted truth only.

## MODIFIED Requirements

### Requirement: The formats are named and versioned
Five formats SHALL be defined. Four SHALL be defined by a JSON Schema file
carrying a `version` field and a stable `$id`: the chart entry format, the
trust vocabulary, the ship's-log receipt format, and the adjacency graph
export format. The schema files SHALL be the single source of those
contracts: `index.jsonl` entries SHALL validate against the chart entry
schema, every line of `log.jsonl` SHALL validate against the receipt
schema, and the trust vocabulary SHALL enumerate exactly the five closed
labels (measured, charted, reported, doubtful, unsurveyed). The fifth
format, the pointer (`portolan-pointer`), SHALL be a text format — a
marker-delimited block carrying a version line — defined by its formats
documentation section and the core module that renders it; being prose
mandates addressed to an agent, it SHALL have no JSON Schema. The block's
lifecycle and placement are the pointer capability's, not this one's.

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

#### Scenario: The pointer block is self-identifying
- **WHEN** a rendered pointer block is read
- **THEN** it sits between the harbor markers and its version line names
  the `portolan-pointer` format version it was rendered against

### Requirement: Formats version by semver from 0.1.0
Each format SHALL start at version `0.1.0` and follow semver: while the
major is 0, a breaking change SHALL bump the minor and an additive change
SHALL bump the patch. For the four schema formats the version SHALL live
only in the schema file, and for the pointer only in the core module that
renders it; data files SHALL NOT carry a format version, with one
exception: a format whose documents self-describe — the adjacency export's
`version` field and the pointer block's version line — names in the
document the format version it was produced against. The pointer's version
SHALL be the format version, never the package version. Declaring `1.0.0`
SHALL be a separate Governor's decision, recorded when made.

#### Scenario: Breaking and additive changes move the version differently
- **WHEN** a schema change removes or redefines an existing field, versus
  one that only adds an optional field
- **THEN** the former bumps the minor (0.1.0 → 0.2.0) and the latter bumps
  the patch (0.1.0 → 0.1.1), and the format's documentation page names the
  new version and the migration consequence

#### Scenario: The pointer's version follows the format, not the package
- **WHEN** the package version is bumped with no pointer-format change, and
  again when the pointer format changes additively
- **THEN** the rendered block's version line stays `0.1.0` in the first
  case and moves by the versioning policy in the second

### Requirement: Every format is documented for adoption
Each format SHALL be documented in the repository — on the formats page or
in its own dedicated section — stating its purpose, its defining artifact
(the schema file path, or for the pointer the marker grammar, the version
line, and the core module that renders it), the current version, and the
stability promise (the versioning policy). The documentation SHALL be the
entry point an external consumer reads without reading Portolan's source.

#### Scenario: A consumer finds the contract without the source
- **WHEN** an external consumer reads the formats documentation
- **THEN** each format section names its defining artifact, the current
  version, and the versioning policy, and no section requires knowledge of
  core internals
