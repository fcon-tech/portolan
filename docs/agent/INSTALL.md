# Agent Install

Portolan can be used as an installed binary or from a source checkout.

## Installed Binary

Check whether `portolan` is already available:

```bash
portolan --version
```

If this works, use `portolan` directly in the quickstart commands.

## Source Checkout

From the Portolan repository root:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

The bootstrap writes a repo-local binary to `.portolan/bin/portolan`.

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
