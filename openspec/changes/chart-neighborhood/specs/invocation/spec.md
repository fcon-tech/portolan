## ADDED Requirements

### Requirement: Query tools ship with a mandated trigger
A chart-query tool whose value depends on being called SHALL be served
only together with: a skill mandate naming the concrete trigger that
requires the call, a row in the skill's tool desk, and a per-tool adoption
counter in `trust.report`. A query tool served without all three violates
this capability. The mandate SHALL sit in the skill's session-start
region, so the trigger is read before work begins, not after.

#### Scenario: chart.neighborhood is mandated at a concrete trigger
- **WHEN** the skill is read at session start
- **THEN** it states that a task touching more than one file or vessel
  requires calling `chart.neighborhood` for each touched vessel before
  any edit

#### Scenario: The tool desk lists the tool
- **WHEN** the skill's tool desk is consulted
- **THEN** `chart.neighborhood` has a row stating its purpose and call
  shape

### Requirement: trust.report reports per-tool adoption
`trust.report` SHALL include an adoption block derived from the ship's
log: for each mandated query tool, the number of invocations recorded and
the receipt ids of the first and most recent invocation. Zero calls SHALL
be reported as openly as many. The counts are invocation facts, not a
measure of mandate compliance, and the report SHALL NOT claim more.

#### Scenario: A call surfaces in the next report
- **WHEN** the Cartographer calls `chart.neighborhood` and then
  `trust.report`
- **THEN** the adoption block shows the incremented invocation count and
  that call's receipt as the last receipt

#### Scenario: Zero calls are reported as zero
- **WHEN** the ship's log holds no invocation of a mandated tool
- **THEN** the adoption block states `invocations: 0` for it, with no
  receipt ids
