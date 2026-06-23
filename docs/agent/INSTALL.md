# Agent Install

Portolan's primary agent route starts from a Portolan URL or local path, then
writes target-local wrappers into the selected project. The legacy Go binary
remains available for explicit compatibility work, but it is not required for
the atlas bundle path.

If the user says "install Portolan" and gives you a target project, resolve
Portolan first, then install the agent harness into that project. Fetch a URL
only after the operator approves fetching exactly that URL.

For captain-facing use, generate the copyable prompt from the two required
inputs:

```bash
scripts/portolan-captain-prompt.sh \
  --portolan <Portolan git URL or local checkout path> \
  --target-root <target-root>
```

Inside the run, the agent resolves `PORTOLAN` to a local `PORTOLAN_PATH`, asking
before URL fetches. If `PORTOLAN` is already a local checkout, use it directly
instead of cloning.

By default this installs a full first atlas command so supported agent
instruction files get the relationships, findings, query artifacts, and
handoff expected by the captain workflow. Use `--scan-profile fast` only when
the operator explicitly wants a lightweight reconnaissance pass before the full
atlas command.

Run doctor before building. It is read-only and reports target shape, output
writability, available/missing tools, rough scan size, and local-first
expectations:

```bash
<target-root>/.portolan/bin/portolan-scan.sh --doctor <target-root> <bundle-dir> --skip-install --no-viewer
```

If the captain asks what Portolan will do, show the dry-run plan:

```bash
<target-root>/.portolan/bin/portolan-scan.sh --dry-run <target-root> <bundle-dir> --skip-install --no-viewer
```

Then build the atlas bundle:

```bash
<target-root>/.portolan/bin/portolan-scan.sh <target-root> <bundle-dir> --yes --skip-install --no-viewer
```

Remove `--skip-install` only after explicit approval to install missing local
OSS tools.

After the scan, read `<bundle-dir>/receipt.json`. It records command argv,
target, bundle, producer states/gaps, local-first flags, duration, and viewer
launch path.

Check whether an existing bundle can be reused without writing anything:

```bash
<target-root>/.portolan/bin/portolan-scan.sh --status <target-root> <bundle-dir>
```

The status output is JSON with bundle existence, receipt status, target,
generated time, gap count, producer states, and viewer handoff when available.
To remove generated Portolan output, clean only the approved bundle path:

```bash
<target-root>/.portolan/bin/portolan-scan.sh --clean <target-root> <bundle-dir>
```

Clean refuses target root, repo root, cwd, home, `/`, and unmarked arbitrary
directories. It must not delete target source files.

## Agent Harness Install

Use the install script when the user wants a coding-agent harness to remember
Portolan for a target project:

```bash
scripts/portolan-install.sh <target-root> --harness cursor
scripts/portolan-install.sh <target-root> --harness opencode
scripts/portolan-install.sh <target-root> --harness codex
scripts/portolan-install.sh <target-root> --harness claude
scripts/portolan-install.sh <target-root> --harness all
scripts/portolan-install.sh <target-root> --harness all --scan-profile fast
```

Outputs:

- Cursor: `<target-root>/.cursor/rules/portolan-atlas.mdc`
- OpenCode/Codex/Zed-compatible agents: managed Portolan block in `<target-root>/AGENTS.md`
- Claude: managed Portolan block in `<target-root>/CLAUDE.md`
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

The product gate runs the static install smoke for Cursor/OpenCode/Codex/Claude
instruction files, target-local command wrapper checks, real Cursor/OpenCode
runtime lanes, local harness smoke, schemas, Go checks, viewer build checks,
and diff whitespace. Omit
`--require-agent-runtime` only when unavailable CLIs should be recorded as
`not_assessed` instead of failing the check.

## Legacy Go Binary

Check whether a legacy `portolan` binary is already available:

```bash
portolan --version
```

If this works and the operator explicitly asked for the legacy compatibility
route, use that binary directly. Otherwise use the atlas wrappers above.

If the operator explicitly chooses the legacy route and `PORTOLAN` has already
been resolved to a local checkout:

```bash
cd "$PORTOLAN_PATH"
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
