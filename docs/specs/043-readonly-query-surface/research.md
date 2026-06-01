# Research: Readonly Query Surface

## Decision: Add CLI Query Before MCP

Rationale: A CLI query can be tested locally and reused by all harnesses. MCP would introduce a daemon/tooling surface before the contract is proven.

Alternatives considered:

- Implement MCP immediately. Rejected for this slice because MCP security and lifecycle need separate review.
- Tell agents to keep reading `graph.json`. Rejected because this does not improve UX on large bundles.

## Decision: Query Findings And Gaps First

Rationale: These are the highest-value agent questions and can be served from existing bounded artifacts.

Alternatives considered:

- Full graph traversal. Rejected because `graph slice` already covers targeted graph extraction and arbitrary traversal needs more design.
