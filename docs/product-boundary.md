# Product Boundary

Portolan gives AI agents and engineering leaders a local, read-only codebase
navigation kit for mapping incomplete software landscapes.

The first product job is not to judge whether a system is good. It is to help an
agent produce a verified map of relationships, duplication, configuration
surfaces, and technical debt while showing what is visible, claimed, missing,
or unverifiable.

For current client-safe wording and claim status, use
[Product Claims](product-claims.md). Product copy may use only accepted or
narrowed claims from that page, and narrowed claims must carry their scope.

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
- Claiming complete inherited-estate coverage from a local repository count.
- Claiming runtime service topology without local runtime observations.
- Claiming UI Cursor/Composer behavior from the current headless Cursor
  comparison.

## Relationship To SDP

Portolan was shaped from SDP discovery work, but it should stand alone as an
open-source scout. It may later emit data that SDP tools consume, but it should
not require `sdp_lab`, Beads, or a specific agent harness to be useful.

## OSS As Part Of The Solution

Portolan should not reimplement mature scanners when a local OSS tool already
solves the evidence-source job well enough. The intended model is to run or
import local outputs and normalize them into the evidence graph.

Syft/CycloneDX, jscpd, Semgrep, Graphify, Repomix, and symbol-index style
exports may be part of the workflow when they are installed locally and
explicitly approved. Their outputs become evidence only after they are saved,
normalized, and assigned an evidence state. A plan to run a scanner is not
evidence.

## How To Talk About Limits

- `unknown` is a valid result, not a failure.
- `cannot_verify` means evidence exists, but Portolan cannot verify it.
- `not_assessed` means the surface was not run or evaluated.
- Local visible scope does not prove complete external estate coverage.
- Partial runtime observations do not prove complete runtime topology.
- A helpful agent answer without local artifact paths is prose, not
  Portolan-backed evidence.
