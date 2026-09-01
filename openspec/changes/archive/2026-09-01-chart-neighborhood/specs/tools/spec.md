## ADDED Requirements

### Requirement: chart.neighborhood traverses the Chart's fairways
The `chart.neighborhood` tool SHALL return the neighborhood of one vessel:
the fairways touching it out to the requested depth (default 1, at most 3)
in the requested direction (`in`, `out`, or `both`; default `both`), each
edge carrying its id, endpoints, trust label, optional relation, staleness,
and anchors with line numbers, together with the touched vessels (id,
trust, staleness) and each touched vessel's ports of entry. Traversal
SHALL follow charted fairways only and SHALL visit each vessel at most
once, so a dependency cycle cannot recurse. A vessel id that is not on the Chart
SHALL be an honest unsurveyed error, never an empty answer dressed as a
neighborhood.

#### Scenario: A one-hop neighborhood in both directions
- **WHEN** `chart.neighborhood` is called for a vessel holding fairways
  both in and out
- **THEN** the response lists exactly those fairways with their anchors
  and trust labels, and the touched vessels with their ports of entry

#### Scenario: An unknown vessel is an honest error
- **WHEN** `chart.neighborhood` is called with a vessel id absent from the
  Chart
- **THEN** the call errors, stating the vessel is not on the Chart
  (unsurveyed), and returns no edges

#### Scenario: Direction and depth are honored
- **WHEN** the call asks for direction `in` and depth 2
- **THEN** only incoming fairways out to two hops are returned and no
  outgoing edge appears

#### Scenario: A dependency cycle cannot recurse
- **WHEN** the fairway graph contains a cycle reachable from the queried
  vessel
- **THEN** traversal visits each vessel once and terminates

#### Scenario: An invalid request is rejected
- **WHEN** the call passes a direction outside the enum, a depth above the
  cap, or a budget above its cap
- **THEN** the call is rejected, naming the violated parameter and its
  allowed values

### Requirement: Neighborhoods are fan-in ranked and budgeted
The tool SHALL order returned vessels by their direct fan-in — the count
of charted incoming fairways — highest first, and SHALL pack the response
greedily in that order within the budget: at most `maxEdges` edges
(default 40, capped) and at most `maxBytes` of serialized response
(default 32768, capped). The byte budget SHALL govern the whole serialized
response — the edges and the touched-vessel list alike — and when the
assembled response still overflows, the tool SHALL drop vessels from the
tail of that rank order, never the queried vessel, which SHALL stay
present. When the budget cuts the neighborhood, the response SHALL say so
explicitly instead of serving a silent prefix, stating what was cut.

#### Scenario: The hub outranks the leaf
- **WHEN** a neighborhood contains a vessel with fan-in 11 and a vessel
  with fan-in 1
- **THEN** the hub appears before the leaf in the vessel list

#### Scenario: A tight budget truncates loudly
- **WHEN** the neighborhood holds more edges than the budget allows
- **THEN** the response is marked truncated, keeps the fan-in-ranked
  prefix within the budget, and states the dropped edges — and the dropped
  vessels when the touched-vessel list is what overflowed the byte budget

#### Scenario: The budget is measured in records and bytes
- **WHEN** `maxBytes` is set
- **THEN** the serialized response stays within `maxBytes`

### Requirement: Verification is on demand and names refuted edges
By default the tool SHALL serve the Chart's truth as stored — trust labels
and anchors without re-sounding. With `verify: true` it SHALL re-sound
every returned edge's anchors through the deterministic `sound.anchor`
machinery, mark each edge confirmed or refuted, and name every refuted
edge with its refuted anchors. An edge whose anchors cannot be sounded —
including one citing no anchor — does not resolve and is refuted. A
refuted sounding SHALL NOT modify the Chart; the verdict informs, the
Cartographer writes.

#### Scenario: verify=true catches a planted lie
- **WHEN** `verify` is true and one returned edge's anchor no longer
  resolves
- **THEN** that edge is marked refuted and named with the failed anchor,
  the remaining edges stand confirmed, and the Chart on disk is unchanged

#### Scenario: Default serves chart truth with labels
- **WHEN** `verify` is false (the default)
- **THEN** edges carry their stored trust labels and anchors and no
  sounding runs

### Requirement: The neighborhood is read-only and honest about staleness
The tool SHALL NOT create or remove any chart entry and SHALL NOT alter
any entry's content, trust label, or anchors; staleness metadata is
refreshed before serving exactly as `chart.read` refreshes it. The tool
SHALL NOT touch any file outside `<target>/.portolan/`. Each call SHALL append
exactly one receipt to the ship's log — the one write the tools
capability allows any tool — so the adoption record exists without
relying on the Cartographer's diligence. Vessels pending correction SHALL
appear in the response with their staleness flag set — never hidden or
filtered.

#### Scenario: A stale hub is flagged, not hidden
- **WHEN** a vessel in the neighborhood is pending correction
- **THEN** it appears with its stale flag set and its fairways remain
  listed

#### Scenario: The neighborhood writes nothing but its receipt
- **WHEN** `chart.neighborhood` runs against a province whose signatures
  are unchanged
- **THEN** the Chart on disk is byte-identical afterwards, no file
  outside `<target>/.portolan/` was touched, and the only write under
  `<target>/.portolan/` is the appended ship's-log receipt
