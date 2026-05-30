# Agent Install

Portolan can be used as an installed binary or from a source checkout.

If the user says "install Portolan" and gives you a Portolan checkout path, use
the source-checkout bootstrap path below. If the user gives you an installed
binary path, verify it with `--version` and use that binary directly.

## Installed Binary

For the public `v0.1.0` source-first release, the primary install route is:

```bash
# Requires the published v0.1.0 tag. If this fails, use the source-checkout
# route below until the tag is available.
go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0
portolan --version
```

Check whether `portolan` is already available:

```bash
portolan --version
```

If this works, use `portolan` directly in the quickstart commands.

## Source Checkout

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

For OpenCode default-permission runs, prefer an `OUTPUT_PATH` under the
Portolan checkout, for example `.portolan/runs/<target-name>`. The recorded
OpenCode external-output default-permission lane failed when the harness
rejected writing outside the allowed workspace; treat arbitrary external output
paths as unverified unless the user changes the permission mode.

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

## Go Run Fallback

Use this only for development when a binary is not available and bootstrap
cannot be used:

```bash
go run ./cmd/portolan --version
go run ./cmd/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

## Safety Defaults

- Local execution only.
- Read-only target inspection.
- No daemon.
- No credentials.
- No network unless explicitly approved.
- Writes only to the selected output directory.

## Local Selection Files

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

Before running an optional producer, verify the upstream tool exists on `PATH`
with its normal `--version` or `--help` command. Common upstream entry points:

- Semgrep: <https://semgrep.dev/docs/getting-started/quickstart>
- Repomix: <https://github.com/yamadashy/repomix>
- Graphify: <https://github.com/safishamsi/graphify>
- Syft: <https://github.com/anchore/syft>
- jscpd: <https://jscpd.dev/>

```bash
portolan produce semgrep --root <target-root> --config <local-semgrep-config> --out <output-dir>/semgrep.json
portolan produce repomix --root <target-root> --out <output-dir>/repomix-output.xml
portolan produce graphify --root <target-root> --out <output-dir>/graphify-run
```

Graphify is staged under `<output-dir>/graphify-run/source-copy` before
execution so the target checkout remains read-only. The staging copy excludes
`.git`, `.portolan`, symlinks, and existing `graphify-out` directories. Import
the produced graph when needed:

```bash
portolan import graphify --in <output-dir>/graphify-run/source-copy/graphify-out/graph.json --root <target-root> --out <output-dir>/graphify-portolan-graph.json
```
