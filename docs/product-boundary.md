# Product Boundary

Portolan gives AI agents a local, repeatable toolbox for mapping incomplete
software landscapes.

The first product job is not to judge whether a system is good. It is to help an
agent produce a verified map of relationships, duplication, configuration
surfaces, and technical debt while showing what is visible, claimed, missing,
or unverifiable.

## In Scope

- Local read-only collection.
- Multi-repo inventory.
- Import and normalization of external tool outputs.
- Black-box representation through metadata, runtime signals, or explicit
  claims.
- Agent-facing CLI workflows and skill/rule packs.
- Relationship, duplication, configuration, and technical-debt findings backed
  by local evidence.
- Machine-readable graph output.
- Machine-readable findings output.
- Human-readable packets generated from graph data.
- Evidence states that preserve uncertainty.

## Out Of Scope

- Automatic rewrite recommendations.
- Merge, release, or procurement decisions.
- Hidden network calls.
- Always-on daemon collection.
- Credential harvesting.
- Requiring Cursor, Claude, Codex, OpenCode, pi, or any one harness.
- Replacing enterprise tools such as Sourcegraph, CAST, Backstage, Port,
  Datadog, New Relic, Dynatrace, or Moderne.

## Relationship To SDP

Portolan was shaped from SDP discovery work, but it should stand alone as an
open-source scout. It may later emit data that SDP tools consume, but it should
not require `sdp_lab`, Beads, or a specific agent harness to be useful.
