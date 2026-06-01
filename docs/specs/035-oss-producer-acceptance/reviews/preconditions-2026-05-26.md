# Preconditions: OSS Producer Acceptance

## Target

- `verified`: `/home/fall_out_bug/projects/bigtop-landscape` exists.
- `verified`: target contains local Bigtop repositories under `repos/`.

## Producer Discovery

- `verified`: `jscpd` 4.2.4 was installed with `npm`.
- `verified`: `syft` 1.44.0 was installed with Homebrew.
- `verified`: `semgrep` 1.157.0 was installed with Homebrew.
- `not_assessed`: Semgrep producer execution still requires a local target
  config; network-backed configs remain outside the default safety boundary.

## Safety Decision

- `verified`: producer tools were installed only after explicit user direction.
- `verified`: Syft was run as a local filesystem scan and wrote only under
  `/tmp/portolan-035-bigtop-context/tool-outputs`.
- `failed`: the full default `jscpd` invocation was interrupted because it
  produced unbounded clone stdout before writing JSON output.
- `verified`: Portolan context output was written to
  `/tmp/portolan-035-bigtop-context`.
- `assumed`: Bigtop target contents are public OSS, but raw generated producer
  outputs are still not committed.
