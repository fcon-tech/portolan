## ADDED Requirements

### Requirement: A full-replace cannot silently mass-shrink the chart
`chart.write` SHALL reject an incoming full-replace whose entry count is
below 75 % of the existing entry count, unless the call explicitly passes
`allowShrink: true`; the rejection SHALL name both counts and the
override. The guard lives in the store, covering every surface. A first
write (no existing entries) and equal-or-growing writes SHALL pass
unchanged.

#### Scenario: A two-entry clobber is refused
- **WHEN** an 87-entry chart receives a full-replace of two entries
- **THEN** the write is rejected, naming 2 and 87 and the `allowShrink`
  override, and the stored chart is unchanged

#### Scenario: The override is explicit and honored
- **WHEN** the same two-entry write passes `allowShrink: true`
- **THEN** the write persists exactly those entries

#### Scenario: First write and growth pass
- **WHEN** a target has no chart, or the incoming write is equal or larger
  than the existing entry count
- **THEN** no shrink check interferes
