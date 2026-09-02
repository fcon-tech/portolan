## Why

Portolan is listed in no distribution channel: `@portolan/core` returns 404
on npm, no `server.json` exists anywhere in the repo, and the only install
path is cloning this repository (`adapters/opencode/install.ts` writes an
absolute launch line into the clone; direct inspection 2026-09-02,
`measured`). Meanwhile the MCP category ships thousands of servers through
solved registry infrastructure (backlog proposal C9, M18, `measured`) —
and the first-run contract, "survey \<target\> with Portolan", is not real
for a stranger's agent while there is nothing to install from.

## What Changes

- One npm package, `@portolan/core` under a new npm org `portolan`,
  carrying core + skill + adapters as a monopackage; the first published
  version is `0.4.4` (continuity with the internal counter).
- A single bin `portolan` with subcommands `serve` (the MCP server),
  `chartroom`, `harbor` — one launch surface that works without a clone.
- A committed `server.json` (the official MCP Registry manifest), updated
  in the same merge-prep commit that bumps the core version; CI validates
  its schema and its version sync with `@portolan/core`.
- The opencode installer writes an npm-based launch line
  (`bunx portolan serve --target …`) instead of clone paths; README
  quickstart and the skill move to the npm path.
- CI publishes to npm on merge to main when the version grew, via trusted
  publishing (OIDC, no secrets in the repo); registry-side registration
  and verification steps that require the Governor's accounts are explicit
  blocked-on-Governor tasks with instructions, not agent actions.

Out of scope (this cycle): plugin marketplaces and pi/omp registries;
telemetry of any kind; bundling ripgrep/ctags (external requirements of
the package, per wrap-don't-build); any change to the fourteen served
tools or the Chart itself.

## Capabilities

### New Capabilities

- `distribution`: the published presence — the npm package and its single
  bin surface, the committed registry manifest with enforced version
  sync, the npm-based install path, and the publish gate (version-grown
  merges publish; first release and account-bound steps are the
  Governor's).

### Modified Capabilities

*(none — `harness` already requires adapters to configure only how the
server is launched; the installer's launch line is implementation, not
spec-level behavior)*

## Impact

- `core/package.json` — packaging, bin entries, publish config; new
  `server.json` at repo root.
- `adapters/opencode/install.ts` — launch line from npm; skill delivery
  out of node_modules (mechanics in design.md).
- CI (`.github/workflows/`) — schema/sync validation and the publish job.
- `README.md`, `skill/SKILL.md` — install path updates.
- External dependencies on people, not packages: npm org `portolan`
  creation, first manual publish, registry domain verification — all
  Governor-owned (`blocked` until done, never claimed ready by the agent).
- Registry fit details (manifest schema, verification procedure, trusted
  publishing mechanics) are `unsurveyed` until the explore stage reads
  the primaries; every assumption above is re-checked there before specs
  are finalized.
