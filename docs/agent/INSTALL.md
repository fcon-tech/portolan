# Agent Install

Portolan's primary agent route is a source checkout installer that writes
target-local wrappers into the selected project. The legacy Go binary remains
available for older `context prepare` / `map` workflows, but it is not required
for the atlas bundle path.

If the user says "install Portolan" and gives you a target project, install the
agent harness into that project:

```bash
git clone https://github.com/fcon-tech/portolan.git
cd portolan
scripts/portolan-install.sh <target-root> --harness all --bundle-dir <target-root>/.portolan/atlas
```

If you already have a Portolan checkout, run the same install command from that
checkout instead of cloning again.

By default this installs a fast first core scan (`config,ctags`, `--core-only`)
so Cursor/OpenCode get a queryable bundle before deeper producers run. Use
`--scan-profile full` when the operator accepts a heavier first command.

Then build the atlas bundle:

```bash
<target-root>/.portolan/bin/portolan-scan.sh <target-root> <bundle-dir> --yes --skip-install --no-viewer
```

Remove `--skip-install` only after explicit approval to install missing local
OSS tools.

## Agent Harness Install

Use the install script when the user wants Cursor/OpenCode to remember Portolan
for a target project:

```bash
scripts/portolan-install.sh <target-root> --harness cursor
scripts/portolan-install.sh <target-root> --harness opencode
scripts/portolan-install.sh <target-root> --harness all
scripts/portolan-install.sh <target-root> --harness all --scan-profile full
```

Outputs:

- Cursor: `<target-root>/.cursor/rules/portolan-atlas.mdc`
- OpenCode: managed Portolan block in `<target-root>/AGENTS.md`
- Command wrappers: `<target-root>/.portolan/bin/`
- Default bundle path: `<target-root>/.portolan/atlas`

The installer also adds `.portolan/` to the target's local
`.git/info/exclude` when the target is a Git repository. It does not edit
tracked source files beyond the requested agent instruction files.

Use `--dry-run` to inspect writes and `--force` to replace an existing managed
Portolan block/rule.

## Verify Installable Pack

Use the static install smoke for generated files and the runtime gate when
Cursor/OpenCode CLIs are available on the current machine:

```bash
scripts/portolan-product-acceptance.sh --require-agent-runtime
```

The product gate runs the static install smoke, target-local command wrapper
checks, real Cursor/OpenCode runtime lanes, local harness smoke, schemas, Go
checks, viewer build checks, and diff whitespace. Omit
`--require-agent-runtime` only when unavailable CLIs should be recorded as
`not_assessed` instead of failing the check.

## Legacy Go Binary

Check whether a legacy `portolan` binary is already available:

```bash
portolan --version
```

If this works and the operator explicitly asked for legacy map/context
artifacts, use that binary directly. Otherwise use the atlas wrappers above.

From the Portolan repository root:

```bash
cd <portolan-checkout>
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

The bootstrap writes a repo-local binary to `.portolan/bin/portolan`. The
version command should print the Portolan version and exit 0. If bootstrap
fails because Go or cached modules are missing, see
`docs/agent/TROUBLESHOOTING.md`; do not fetch dependencies from the network
unless the user approves it.

When the receiving harness restricts writes outside the current checkout, use a
repo-local output directory such as `.portolan/runs/<name>` for the first run,
then move or share the artifacts only after the run succeeds.

For OpenCode default-permission runs, prefer `BUNDLE_DIR` under the target
project, for example `<target-root>/.portolan/atlas`. Treat arbitrary external
output paths as unverified unless the user changes the permission mode.

If you are in a subdirectory, run the script by path; the default output still
lands in the Portolan checkout:

```bash
../scripts/bootstrap-portolan
../.portolan/bin/portolan --version
```

By default it does not fetch Go modules from the network. If the user explicitly
approves network access for dependency download, set:

```bash
PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1 scripts/bootstrap-portolan
```

### Go Run Fallback

Use this only for development when a binary is not available and bootstrap
cannot be used:

```bash
go run ./cmd/portolan --version
go run ./cmd/portolan context prepare --root <target-root> --out <context-dir> --profile agent
```

## Safety Defaults

- Local execution only.
- Read-only target inspection.
- No daemon.
- No credentials.
- No network unless explicitly approved.
- Writes only to the selected output directory.

## Legacy Local Selection Files

If the target contains a local `selection.json`, validate and use it for the map
step:

```bash
portolan selection validate --selection <target-root>/selection.json
portolan map --selection <target-root>/selection.json --out <output-dir>/map
```

Use `map --root <target-root>` when no selection is supplied. Do not invent a
selection file. If selection validation fails, record that validation command as
`failed`, then fall back to `map --root <target-root>` unless the user asked
you to stop on invalid selections.

## Optional Local OSS Producers

Portolan can invoke installed local OSS tools when the user explicitly asks for
those evidence sources and the tools are already installed. Portolan does not
bundle these scanners. Do not install or download these tools without approval.

Before running an optional OSS tool, verify the upstream tool exists on `PATH`
with its normal `--version` or `--help` command. Prefer the native CLI, skill,
or MCP surface for that tool; Portolan imports and normalizes the resulting
local output.

- Semgrep: <https://semgrep.dev/docs/getting-started/quickstart>
- Repomix: <https://github.com/yamadashy/repomix>
- Graphify: <https://github.com/safishamsi/graphify>
- Syft: <https://github.com/anchore/syft>
- jscpd: <https://jscpd.dev/>

```bash
semgrep --config <local-semgrep-config> --json --output <output-dir>/semgrep.json <target-root>
repomix <target-root> --output <output-dir>/repomix-output.xml --style xml
# Produce Graphify graph.json with native Graphify CLI, skill, or MCP.
```

If the selected Graphify mode writes inside its input path, run it against an
explicit staged copy outside the target checkout. Import the produced
graph when needed:

```bash
portolan import graphify --in <output-dir>/graphify-out/graph.json --root <target-root> --out <output-dir>/graphify-portolan-graph.json
```
