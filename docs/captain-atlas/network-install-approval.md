# Target Network / Install Approval Check

Task H requires: "Add explicit target-network/install approval checks or mark
them not assessed with a reason."

Portolan's product contract is **local-first and read-only by default**. The
following approval states apply to every scan/agent run.

## Approval matrix

| Capability | Default state | Approval required to enable | Verdict |
|------------|---------------|-----------------------------|---------|
| Read local source tree | allowed (read-only) | none | verified |
| Write under `<target>/.portolan/` | allowed (approved output area) | none | verified |
| Write agent instruction files (`.cursor/rules/portolan-atlas.mdc`, `AGENTS.md`, `CLAUDE.md`) | allowed (approved instruction files, recorded in system map `target.approved_instruction_files`) | none | verified |
| Network fetch to target/external services | **disabled** | explicit product approval | not_assessed — no network capability exists; producer runs are all local processes (ctags, jscpd, config-scan). No `fetch`/`http` calls in the system-map adapter or viewer. |
| Target mutation outside `.portolan/` | **disabled** | explicit product approval | verified — read-only proof: Cursor Agent CLI run left source tree unchanged (git status clean except untracked `.portolan/`). |
| Credentials / secrets | **never read** | n/a | verified — no secret-reading code; `secret_reference_name` is a surface classification, not a reader. |
| Install binary dependencies (ctags, etc.) | opt-in via `portolan-install.sh` | user runs install explicitly | not_assessed — `portolan-install.sh` is invoked explicitly by the user/captain, never automatically by a scan. `--skip-install` flag keeps scans dependency-free. |
| Hosted/daemon services | **none** | n/a | verified — no daemon, no hosted service, no background process. |

## Evidence

- **Read-only proof**: `docs/captain-atlas/cursor-agent-cli-scorecard.json`
  `target_source_modified: false` with `git status` showing only `.portolan/`
  untracked.
- **Approved output area**: `schema/system-map.schema.json`
  `target.approved_output_area: ".portolan"` and
  `target.approved_instruction_files` enumerates the allowed instruction files.
- **No network in adapter**: `viewer/scripts/build-system-map.js` contains zero
  `fetch`/`http`/`require('https')`/`require('http')` calls; it is a pure
  read-only normalizer over local bundle files.

## Items marked not_assessed (with reason)

- **Network fetch to target/external services**: not_assessed because Portolan
  has no such capability to approve or deny — all producers are local. If a
  future producer needs network (e.g. fetching a remote manifest), it must be
  gated behind an explicit approval flag before activation.
- **Binary dependency install**: not_assessed because install is an explicit,
  user-initiated action (`portolan-install.sh`), not a scan side-effect.
  `--skip-install` is the default-safe path used by every harness.
