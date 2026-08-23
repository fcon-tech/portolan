## Why

The Cartographer reads the province through tools, not by hand. The product
contract (docs/MANIFEST.md) names four probe/receipt tools as the v1 core —
`sweep`, `symbols`, `manifests`, and the ship's log — but their behavior
contracts do not exist yet. Without anchored, labeled probe output, the Chart
has no measured or charted evidence to draw on.

## What Changes

- Add the `sweep` tool contract: ripgrep-backed pattern search returning
  anchored chunks labeled `measured`.
- Add the `symbols` tool contract: ctags-backed definitions (and references
  where resolvable) with anchors, labeled `measured`.
- Add the `manifests` tool contract: cheap deterministic facts from go.mod,
  pom.xml, package.json, Cargo.toml, pubspec.yaml — the only permitted
  structural parsing exception — labeled `charted`.
- Add the ship's log (`log.append` / `log.read`): an append-only receipt for
  every command run; receipt ids are anchor targets.
- Define observable error conditions for all four, including missing-binary
  behavior and the read-only guarantee toward source.

## Capabilities

### New Capabilities

- `tools`: the probe and receipt tool contracts the Cartographer uses to
  gather evidence from the province — sweep, symbols, manifests, and the
  ship's log — every result anchored and trust-labeled.

### Modified Capabilities

(none)

## Impact

- Implementation lands later under `core/tools/` (TypeScript on Bun, wrapping
  ripgrep and ctags as external binaries per docs/MANIFEST.md).
- Builds on core-foundation types (Anchor, TrustLabel); does not change the
  `chart` capability or re-spec it.
- New test fixtures for each manifest format; no third-party runtime
  dependencies beyond small manifest readers recorded in design.md.
