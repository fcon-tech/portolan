## ADDED Requirements

### Requirement: Fairway relations are typed when known
A fairway MAY carry a `relation` drawn from the closed enum `build`,
`runtime`, `config` — the senses the anchors can actually support. A
fairway without a relation remains valid and reads as untyped. An unknown
relation value SHALL be rejected exactly like an unknown trust label:
the write fails naming the enum.

#### Scenario: An out-of-enum relation is rejected
- **WHEN** `chart.write` is called with a fairway whose relation is
  `imports`
- **THEN** the write is rejected, naming the allowed enum values

#### Scenario: An untyped fairway stays valid
- **WHEN** a chart holds fairways without a relation — charts written
  before the enum existed
- **THEN** `chart.read` serves them unchanged and the neighborhood reads
  them as untyped edges
