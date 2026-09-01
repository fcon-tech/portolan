## MODIFIED Requirements

### Requirement: One MCP server exposes the full toolset
Portolan SHALL be delivered as a single MCP server over stdio that
advertises every tool under its Portolan name — `chart.read`,
`chart.write`, `chart.render`, `trust.report`, `chart.neighborhood`,
`sweep`, `symbols`, `manifests`, `sound.edge`, `sound.anchor`,
`log.append`, `log.read`, `expeditions.propose`, `expeditions.decide`.
Each tool SHALL accept the inputs and return the structured, anchored,
trust-labeled results its own capability defines; the server SHALL NOT
reinterpret, rename, or flatten them.

#### Scenario: The tool list is complete
- **WHEN** a harness client asks the server for its tool list
- **THEN** all fourteen tools are advertised under their Portolan names

#### Scenario: Results pass through structured
- **WHEN** a client calls `sweep` with a valid pattern
- **THEN** the response carries the anchored, `measured`-labeled chunks
  exactly as the tools capability defines them, not a flattened text dump

### Requirement: opencode is the first adapter, shims follow
The delivery SHALL include a first-class adapter that makes the full
toolset available in opencode, and SHALL support pi and omp through thin
launch shims that add no behavior of their own.

#### Scenario: opencode sees every tool
- **WHEN** the opencode adapter is installed and a session starts
- **THEN** the Cartographer can call all fourteen served tools from
  opencode

#### Scenario: pi and omp reach the same server
- **WHEN** a pi or omp shim launches the server
- **THEN** the tool list and behavior match the opencode installation
