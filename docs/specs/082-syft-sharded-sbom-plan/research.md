# Research

## Decision: Shard Syft By Repository

Emit one Syft/CycloneDX command per discovered repository in multi-repo
contexts.

Rationale:

- The integrated Cursor stress found that jscpd and Maven next actions were
  concrete after sharding, while generic Syft remained a full-root command.
- Syft already produces a standard CycloneDX JSON shape that Portolan can
  normalize later.
- Repository sharding makes failures and missing output honest per shard and
  prevents accidental whole-landscape coverage claims.

Rejected alternatives:

- Run Syft automatically. Rejected; producer execution still needs approval.
- Add a new SBOM scanner. Rejected; Syft already solves the producer role.
- Emit one command per manifest. Rejected; repository-level SBOM is the
  appropriate bounded operator unit for this slice.
