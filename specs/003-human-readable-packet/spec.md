# Feature Specification: Human-Readable Evidence Packet

**Feature Branch**: `003-human-readable-packet`
**Created**: 2026-05-20
**Status**: Implemented in branch
**Input**: Product backlog P0-003: generate a readable packet from the same evidence graph without creating a second truth source.

## User Scenarios & Testing

### User Story 1 - Read Map Summary (Priority: P1)

A CTO opens a generated packet and sees visible systems, claims, unknowns, and cannot-verify areas.

**Independent Test**: Render a packet from a fixture graph and verify the text contains the same node/edge counts and evidence-state counts as the JSON.

### User Story 2 - Preserve Graph Authority (Priority: P1)

A reviewer can trace every packet statement back to graph data.

**Independent Test**: Packet sections cite graph ids for facts that are not aggregate counts.

## Requirements

- **FR-001**: Packet generation MUST read an existing graph file.
- **FR-002**: Packet generation MUST NOT add new facts that are absent from the graph.
- **FR-003**: Packet output MUST summarize evidence states separately.
- **FR-004**: Packet output MUST call out `unknown` and `cannot_verify` areas.
- **FR-005**: Packet output MUST include enough graph ids to audit non-aggregate statements.
- **FR-006**: Packet generation MUST use Markdown as the first output format.
- **FR-007**: Packet generation MUST fail clearly for malformed graph JSON and
  MUST NOT write a partial packet on parse failure.
- **FR-008**: Packet generation MUST NOT make network calls or mutate target
  repositories.

## Success Criteria

- **SC-001**: Packet generation from a fixture graph exits 0 and writes Markdown.
- **SC-002**: Counts in the packet match counts computed from JSON.
- **SC-003**: A graph with only claim evidence is not described as observed truth.
- **SC-004**: `go run ./cmd/portolan packet render --graph <graph.json> --out
  <packet.md>` exits 0 for the fixture graph.

## Assumptions

- Markdown is the first human-readable output format.
- HTML/PDF rendering belongs to later productization.
