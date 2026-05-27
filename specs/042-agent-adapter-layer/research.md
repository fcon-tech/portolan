# Research: Agent Adapter Layer

## Decision: Treat Graphify As Input Producer, Not Core Dependency

Rationale: Graphify has useful graph/query/assistant features, but Portolan's boundary is evidence normalization for agents. Importing local output preserves optionality and avoids Python/runtime coupling.

Alternatives considered:

- Vendor Graphify or run it automatically. Rejected due to dependency, privacy, and product-boundary risk.
- Ignore Graphify. Rejected because it is a strong OSS reference and likely useful producer.

## Decision: Keep SCIP/Serena And Repomix As Profiles First

Rationale: Symbol indexes and context packs have different evidence semantics. Profiles clarify mapping before code import expands.

Alternatives considered:

- Build native LSP/index first. Rejected as NIH and broader than needed.
- Treat context packs as architecture evidence. Rejected because packed text is context, not proof.
