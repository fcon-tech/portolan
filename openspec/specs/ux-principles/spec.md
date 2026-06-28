# UX Principles Specification

## Purpose

Defines the product UX principles (not feature polish): zero-copied-commands
install, conversational intake, one entry point, self-contained agentic
instructions, and visual quality as part of the product.

Source authority: `docs/captain-atlas/08-portolan-product-charter.md` § UX
Principles (migrated).

## Requirements

### Requirement: Zero copied commands
The admiral SHALL drop a Portolan link to an agent and lean back. The agent
MUST install Portolan autonomously. The admiral MUST type no command beyond the
initial prompt. Approval prompts for target mutation (writes under `.portolan/`,
network access) are allowed and expected.

#### Scenario: Fresh agent reaches /portolan:map with no copied command
- GIVEN a fresh agent is given only the Portolan link
- WHEN it runs the first-run flow
- THEN it reaches /portolan:map
- AND no command was copied from docs by the admiral beyond the initial prompt

### Requirement: Conversational intake
The agent SHALL ask the admiral what they have; it MUST NOT demand a filled-in
YAML manifest. Managed intake is a dialogue that produces a typed intake result
the deterministic core consumes without re-asking.

#### Scenario: Dialogue produces a typed result
- GIVEN the agent runs intake
- WHEN the dialogue completes
- THEN a typed intake result is persisted under .portolan/
- AND the deterministic core consumes it without re-asking the admiral

### Requirement: One entry point
`/portolan:map` SHALL be the single agent-side command that opens the atlas. It
builds the snapshot if stale and opens the behaviour map. The system MUST NOT
require the admiral to configure a server, open localhost manually, or navigate
to start.

#### Scenario: No manual server configuration
- GIVEN the admiral has run intake
- WHEN the atlas is opened
- THEN /portolan:map builds and opens it
- AND the admiral did not configure a server or open localhost manually

### Requirement: Agentic instructions are self-contained
Every YAML, script, command, and toolchain SHALL be embedded in the agent
instructions. The agent MUST NOT have to search, invent, or copy from docs.

#### Scenario: Agent finds everything in its instructions
- GIVEN an agent runs the Portolan flow
- WHEN it needs a script, command, or toolchain
- THEN it is present in the embedded agent instructions
- AND the agent does not search external docs

### Requirement: Visual quality is part of the product
The atlas SHALL have visual quality as part of the product: a dark map, colour
hierarchy, and interactive SVG. The cartographic/plain style toggle (see
Navigation spec) is the presentation layer; both styles render the same data.

#### Scenario: Atlas renders with colour hierarchy
- GIVEN the atlas renders
- WHEN the admiral views any map
- THEN units and edges use a colour hierarchy and interactive SVG
