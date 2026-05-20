# Quickstart: Human-Readable Evidence Packet

## Generate Graph

```bash
go run ./cmd/portolan scan --selection testdata/local-evidence-graph/selection.json --out /tmp/portolan-graph.json --force
```

## Render Packet

```bash
go run ./cmd/portolan packet render --graph /tmp/portolan-graph.json --out /tmp/portolan-packet.md --force
```

## Expected Outcome

- The packet is Markdown.
- Node, edge, and evidence-state counts match the graph.
- Claim-only facts are labeled as claimed, not observed.
- Unknown and cannot-verify evidence states are visible.
- Non-aggregate statements cite graph ids.
