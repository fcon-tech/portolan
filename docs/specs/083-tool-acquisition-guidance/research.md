# Research: Tool Acquisition Guidance

## Decision: Generic acquisition guidance over per-stack adapters

- **Decision**: Keep producer planning organized by evidence family and local
  tool candidate, not by programming-language adapter.
- **Rationale**: The operator needs practical next actions such as "pull in a
  local SBOM producer" or "run a duplication tool", but Portolan must not become
  a JVM/PHP/Gradle scanner.
- **Rejected alternative**: Add a Gradle-specific slice after integrated stress.
  Rejected because it turns a residual tool gap into stack ownership.

## OSS posture

- Mature OSS/native tools remain the right acquisition targets when they
  produce local files that Portolan can normalize.
- Tool recommendations are options, not evidence.
- Missing or unrun candidate tools remain `not_assessed`.

## Risk posture

- Tool acquisition can involve network access, cache writes, project mutation,
  dependency coordinate exposure, or runtime side effects.
- Portolan must surface those risks before suggesting any command as a next
  action.
