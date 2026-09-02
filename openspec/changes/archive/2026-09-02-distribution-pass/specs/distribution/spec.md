# distribution Specification (delta)

## ADDED Requirements

### Requirement: The product installs as one npm package
Portolan SHALL be published as a single npm package `@fcon-tech/portolan`
(scope `fcon-tech`) carrying core, skill, and adapters together. Installing
the package into a clean environment — with Bun, ripgrep, and ctags as the
only declared external requirements — SHALL yield a working product; the
package MUST NOT bundle ripgrep or ctags and MUST NOT require a clone of
this repository.

#### Scenario: A clean environment installs and runs
- **WHEN** a machine with Bun, ripgrep, and ctags — and no Portolan
  repository — installs `@fcon-tech/portolan` from npm
- **THEN** the package's entry point runs and the served tool list matches
  the fourteen Portolan tools

### Requirement: One launch surface serves the product
The package SHALL expose a single executable, `portolan`, with the
subcommands `serve` (the MCP server), `chartroom`, and `harbor`, matching
the behavior of the in-repository entry points. A harness launching the
published package SHALL observe tool listings, results, and errors
indistinguishable from a direct launch of the same server.

#### Scenario: serve matches the in-repo server
- **WHEN** a harness launches the published package with
  `portolan serve --target <province>`
- **THEN** the tool list and every tool's behavior match the
  repository-launched server for that target

#### Scenario: The CLIs stay reachable
- **WHEN** the published package's `chartroom` and `harbor` subcommands are
  invoked with the arguments the repository CLIs accept
- **THEN** they behave as those CLIs do

### Requirement: The registry manifest is committed and version-synced
A `server.json` manifest for the official MCP Registry SHALL live in the
repository, and its version SHALL equal the `@fcon-tech/portolan` package
version. The manifest SHALL be updated by the same release-prep change
that bumps the version, and CI SHALL reject a state where the manifest is
schema-invalid or its version differs from the package version.

#### Scenario: A synced manifest passes
- **WHEN** CI runs on a commit where `server.json` is schema-valid and its
  version equals the package version
- **THEN** the manifest check passes

#### Scenario: A drifted manifest is caught
- **WHEN** `server.json`'s version differs from the `@fcon-tech/portolan`
  version, or the manifest fails schema validation
- **THEN** CI fails naming the mismatch

### Requirement: Publishing is version-gated and secret-free
Merging to main with a grown `@fcon-tech/portolan` version SHALL publish the
package to npm, with no long-lived secrets in the repository. A merge
without a version bump SHALL NOT publish.

#### Scenario: A version-bump merge publishes
- **WHEN** a merge to main raises the package version and CI is green
- **THEN** a publish job runs exactly once for that version; a rerun
  against the same version fails at the registry, which refuses
  duplicates

#### Scenario: An unchanged version does not publish
- **WHEN** a merge to main leaves the package version unchanged
- **THEN** no publish job runs

### Requirement: The install path is registry-based
The opencode installer SHALL write a launch line that resolves the
published package (`bunx --package @fcon-tech/portolan portolan serve --target …`) rather than paths
into a repository clone, and the Sailing Directions and quickstart
documentation SHALL describe the registry-based install path.

#### Scenario: The installer works without a clone
- **WHEN** the installer runs on a machine that has the published package
  but no Portolan repository
- **THEN** the written launch configuration starts the fourteen-tool
  server against the given target

#### Scenario: The documentation points at the registry
- **WHEN** the quickstart or the skill instructs a fresh installation
- **THEN** the instruction uses the npm install path, not a repository
  clone

### Requirement: Account-bound steps belong to the Governor
The publish procedure SHALL name the steps that require the Governor's
accounts — npm org creation, the first manual release, registry-domain
verification — and automation SHALL NOT perform them. Until those steps
complete, their standing is reported as `blocked`, never as ready.

#### Scenario: The first release waits for the Governor
- **WHEN** a version-bump merge lands before the Governor's one-time setup
  (org, trusted publishing, domain verification) is complete
- **THEN** CI reports the publish as blocked with the missing step named,
  and nothing is published
