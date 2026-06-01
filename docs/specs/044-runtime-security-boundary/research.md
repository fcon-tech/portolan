# Research: Runtime Security Boundary

## Decision: Contract First For Runtime Observations

Rationale: Runtime topology remains unassessed because no complete runtime evidence is supplied by default. A local input contract lets users provide observations while preserving partial-evidence limits.

Alternatives considered:

- Add observability integrations. Rejected because they require credentials, network, and vendor-specific scope.
- Infer runtime topology from source. Rejected because source-visible dependencies are not runtime communication.

## Decision: Product-Specific Threat Model

Rationale: Portolan's real risk is untrusted repo artifacts becoming agent instructions or leaking sensitive values. A focused threat model is more useful than broad security claims.

Alternatives considered:

- Say "local-only is safe enough." Rejected because local artifacts can still poison agent-facing outputs.
