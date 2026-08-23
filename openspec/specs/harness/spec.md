# harness Specification

## Purpose
Defines how Portolan reaches the Cartographer's harness: every tool served
through one Model Context Protocol server over stdio, rejections reported as
tool errors rather than crashes, and delivery that stays identical across
harnesses with opencode as the first adapter.

## Requirements

### Requirement: One MCP server exposes the full toolset
Portolan SHALL be delivered as a single MCP server over stdio that
advertises every v1 tool under its Portolan name — `chart.read`,
`chart.write`, `sweep`, `symbols`, `manifests`, `sound.edge`,
`sound.anchor`, `log.append`, `log.read`. Each tool SHALL accept the inputs
and return the structured, anchored, trust-labeled results its own
capability defines; the server SHALL NOT reinterpret, rename, or flatten
them.

#### Scenario: The tool list is complete
- **WHEN** a harness client asks the server for its tool list
- **THEN** all nine v1 tools are advertised under their Portolan names

#### Scenario: Results pass through structured
- **WHEN** a client calls `sweep` with a valid pattern
- **THEN** the response carries the anchored, `measured`-labeled chunks
  exactly as the tools capability defines them, not a flattened text dump

### Requirement: The server is bound to one province
The server SHALL be launched against exactly one target root and SHALL
scope every tool operation to that target. Tool calls SHALL NOT accept an
alternative target; changing provinces means launching a new server.

#### Scenario: Tools inherit the launch target
- **WHEN** the server is launched against a target and a client calls
  `manifests` without naming a root
- **THEN** the operation runs against the launched target's files

#### Scenario: A call cannot redirect the target
- **WHEN** a tool call includes a target root different from the launch
  target
- **THEN** the call is rejected with an error naming the launched target

### Requirement: Tool rejections surface as tool errors, not crashes
When an underlying tool rejects a call — the chart store refusing an entry
without anchors or a trust label, a malformed sweep pattern, a missing
binary — the server SHALL return that rejection as an MCP tool error
carrying the tool's own error message, and the process SHALL continue
serving subsequent calls. Only transport-level failures may terminate the
server.

#### Scenario: A rejected chart write is a tool error
- **WHEN** a client submits `chart.write` with an anchor-less entry
- **THEN** the client receives a tool error naming the offending entry, and
  a follow-up call to another tool succeeds without a restart

#### Scenario: Repeated errors do not kill the server
- **WHEN** several consecutive tool calls are rejected
- **THEN** the server remains alive and answers the next valid call

### Requirement: The served tools are harness-agnostic
The server SHALL exhibit identical tool listings, inputs, outputs, and error
behavior regardless of which harness connects. Harness-specific wiring SHALL
live in adapters that only configure how the server is launched; an adapter
MUST NOT duplicate, filter, or reinterpret tool behavior.

#### Scenario: Two harnesses see the same server
- **WHEN** the same server is connected from two different harnesses
- **THEN** both observe the same tool list and the same results for the same
  calls

#### Scenario: An adapter adds no behavior
- **WHEN** a harness adapter launches the server
- **THEN** the tools, their results, and their errors are indistinguishable
  from a direct launch of the same server

### Requirement: opencode is the first adapter, shims follow
The delivery SHALL include a first-class adapter that makes the full
toolset available in opencode, and SHALL support pi and omp through thin
launch shims that add no behavior of their own.

#### Scenario: opencode sees every tool
- **WHEN** the opencode adapter is installed and a session starts
- **THEN** the Cartographer can call all nine v1 tools from opencode

#### Scenario: pi and omp reach the same server
- **WHEN** a pi or omp shim launches the server
- **THEN** the tool list and behavior match the opencode installation
