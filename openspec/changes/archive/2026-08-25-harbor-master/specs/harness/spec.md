## MODIFIED Requirements

### Requirement: One MCP server exposes the full toolset
Portolan SHALL be delivered as a single MCP server over stdio that
advertises every tool under its Portolan name — `chart.read`,
`chart.write`, `sweep`, `symbols`, `manifests`, `sound.edge`,
`sound.anchor`, `log.append`, `log.read`, `expeditions.propose`,
`expeditions.decide`. Each tool SHALL accept the inputs
and return the structured, anchored, trust-labeled results its own
capability defines; the server SHALL NOT reinterpret, rename, or flatten
them.

#### Scenario: The tool list is complete
- **WHEN** a harness client asks the server for its tool list
- **THEN** all eleven tools are advertised under their Portolan names

#### Scenario: Results pass through structured
- **WHEN** a client calls `sweep` with a valid pattern
- **THEN** the response carries the anchored, `measured`-labeled chunks
  exactly as the tools capability defines them, not a flattened text dump
