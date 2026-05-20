# Product Boundary

Portolan maps incomplete software landscapes into an evidence graph.

The first product job is not to judge whether a system is good. It is to show
what is visible, what is claimed, what is missing, and what cannot be verified.

## In Scope

- Local read-only collection.
- Multi-repo inventory.
- Import and normalization of external tool outputs.
- Black-box representation through metadata, runtime signals, or explicit
  claims.
- Machine-readable graph output.
- Human-readable packets generated from graph data.
- Evidence states that preserve uncertainty.

## Out Of Scope

- Automatic rewrite recommendations.
- Merge, release, or procurement decisions.
- Hidden network calls.
- Always-on daemon collection.
- Credential harvesting.
- Replacing enterprise tools such as Sourcegraph, CAST, Backstage, Port,
  Datadog, New Relic, Dynatrace, or Moderne.

## Relationship To SDP

Portolan was shaped from SDP discovery work, but it should stand alone as an
open-source scout. It may later emit data that SDP tools consume, but it should
not require `sdp_lab`, Beads, or a specific agent harness to be useful.
