## MODIFIED Requirements

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
  the fifteen Portolan tools

### Requirement: The install path is registry-based
The opencode installer SHALL write a launch line that resolves the
published package (`bunx --package @fcon-tech/portolan portolan serve --target …`) rather than paths
into a repository clone, and the Sailing Directions and quickstart
documentation SHALL describe the registry-based install path.

#### Scenario: The installer works without a clone
- **WHEN** the installer runs on a machine that has the published package
  but no Portolan repository
- **THEN** the written launch configuration starts the fifteen-tool
  server against the given target

#### Scenario: The documentation points at the registry
- **WHEN** the quickstart or the skill instructs a fresh installation
- **THEN** the instruction uses the npm install path, not a repository
  clone
