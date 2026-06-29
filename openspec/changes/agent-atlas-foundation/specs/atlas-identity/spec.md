# Spec Delta — atlas-identity

## ADDED Requirements

### Requirement: Agent-atlas is the base; human-atlas is an optional skin
Portolan SHALL be two products on a shared deterministic core. The agent-atlas
SHALL be the foundation: a local, read-only data and query substrate that the
coding agent consumes to navigate and edit the landscape. The human-atlas SHALL
be an optional presentation layer that renders the same snapshot for the
admiral; it MUST NOT be required for the agent-atlas to function and MUST be
selectable as an install-time option.

#### Scenario: Agent path works without the human skin
- GIVEN the agent-atlas is installed without the human-atlas skin
- WHEN the agent collects and queries the landscape
- THEN the agent receives the snapshot and query results
- AND no presentation layer, HTML atlas, or browser UI is required

#### Scenario: Human skin is an install-time option over the same snapshot
- GIVEN the agent-atlas has produced a snapshot
- WHEN the admiral opts into the human-atlas at install time
- THEN the JS reading layer renders the same snapshot
- AND the rendered atlas shows identical data to the agent's query results

### Requirement: Agent-atlas tentacles are smart, fast, and economical
The agent-atlas SHALL expose the landscape as a bounded, query-aware substrate,
not an undifferentiated data dump. Agent queries SHALL be token-economical: the
substrate MUST return bounded, query-relevant results (symbol, reference,
dependency, surface, finding) rather than whole-graph payloads, so the agent's
context budget is respected. A query for one symbol MUST NOT return the entire
graph as its default answer.

#### Scenario: Query returns bounded, relevant results
- GIVEN the agent asks the substrate for a symbol and its references
- WHEN the substrate answers
- THEN it returns the symbol, its definition, and its immediate references
- AND it does not return the whole-landscape graph

#### Scenario: Whole-graph dump is not the default agent surface
- GIVEN the agent begins navigating an unfamiliar landscape
- WHEN it opens the substrate without a specific query
- THEN it receives a bounded overview (units, dominant groupings, scale)
- AND a full graph is available only as an explicit, opt-in query

### Requirement: Language fit follows the consumer, not author preference
The deterministic collector and query substrate SHALL be implemented in Go and
SHALL run Node-free on the agent path (single binary plus native tools). The
human-atlas presentation layer SHALL be implemented in the JS reading layer over
the snapshot. Shell scripts SHALL be thin drivers only. Where behaviour lives
SHALL be governed by the consumer it serves and the language fit for the job,
not by author preference.

#### Scenario: Agent path runs Node-free
- GIVEN the agent-atlas is installed on a host with the Go binary and native
  tools (ripgrep, ctags) but no Node runtime
- WHEN the agent collects and queries
- THEN collection and querying succeed
- AND no Node runtime is invoked

#### Scenario: Collector behaviour is not implemented in the presentation layer
- GIVEN the repository is inspected
- WHEN the collector's scanning, indexing, and producer-execution code is located
- THEN it lives under the Go core (`internal/`, `cmd/portolan`)
- AND the JS reading layer (`portolan-core/src`) contains no collector logic
