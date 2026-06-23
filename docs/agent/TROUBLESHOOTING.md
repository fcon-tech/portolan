# Agent Troubleshooting

## Installed Wrapper Not Found

The primary agent interface is target-local:

```bash
<target-root>/.portolan/bin/portolan-scan.sh
<target-root>/.portolan/bin/portolan-bundle-query.sh
<target-root>/.portolan/bin/portolan-viewer.sh
```

If those files are missing, install the atlas pack again:

```bash
"$PORTOLAN_PATH/scripts/portolan-install.sh" "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
```

If an existing Cursor rule or OpenCode block blocks replacement, do not edit
around it silently. Re-run with `--force` only after confirming the file/block is
Portolan-managed and safe to replace.

## Doctor Finds A Bad First-Run Shape

Run doctor before the first scan:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
```

If the bundle status is `unsafe` or `not_writable`, choose a writable Portolan
output path such as `$TARGET_ROOT/.portolan/atlas`. Missing producer tools are
not a first-run blocker when `--skip-install` is present; they should become
`not_assessed` or `cannot_verify` gaps after scan.

Use dry-run when the captain asks what will happen:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --dry-run "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
```

## Bundle Build Fails Or Writes Nowhere

Run through the installed wrapper, not the external checkout:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
```

If the harness blocks external writes, use `$TARGET_ROOT/.portolan/atlas` as the
bundle directory.

If the scan created a bundle directory, inspect `$BUNDLE_DIR/receipt.json`. A
failed receipt records the phase, command argv, producer states/gaps, duration,
and local-first flags.

For a machine-readable reuse check, run status. It is read-only and should be
safe before or after a scan:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "$TARGET_ROOT" "$BUNDLE_DIR"
```

## Output Directory Already Exists

Do not overwrite silently. Either choose a fresh output directory or use
`--force` only after the user accepts replacing that Portolan output.

To remove a generated Portolan bundle, use clean on the bundle path, not on the
target:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --clean "$TARGET_ROOT" "$BUNDLE_DIR"
```

If clean refuses the path, choose `$TARGET_ROOT/.portolan/atlas` or a bundle
that contains Portolan's generated marker/receipt. Do not use shell `rm -rf` on
the target root.

## Missing OSS Tools

Keep the default `--skip-install` for first runs. Missing jscpd, Semgrep, Syft,
ctags, or similar tools should produce `not_assessed` / `cannot_verify` gaps,
not invented evidence. Remove `--skip-install` only after operator approval.

## The Atlas Is Too Large

Use bundle-query instead of loading raw files into the chat:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section components --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
```

Read bounded artifacts before raw full artifacts:

- `summary.json`
- `manifest.json`
- `repos.json`
- `findings.jsonl`
- `hotspots.jsonl`
- `gaps.jsonl`

Use `hotspots-full.jsonl` only through bundle-query or after narrowing.

## Viewer Does Not Open

Serve the bundle through the installed wrapper:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-viewer.sh" --bundle "$BUNDLE_DIR"
```

If the port is busy, pass `--port <free-port>`.

## The Target Has Missing Repositories

Do not clone or fetch by default. Mark missing source as `unknown`,
`cannot_verify`, or `not_assessed`. Ask for a local selection or manifest if
complete scope matters.

## No Runtime Topology Appears

Runtime topology requires local runtime observations. Without those inputs,
report runtime topology as `not_assessed`.

## No Near-Clone Duplication Appears

Duplication findings require selected local duplication tool output, such as
jscpd/CPD-style JSON. If that evidence is absent, report duplication coverage
as `not_assessed`.

## No Semgrep Or Semantic Config Findings Appear

Portolan does not run network-backed Semgrep configs by default. Use local
Semgrep output only when it exists or the user approves producing it.

## The Agent Wants To Guess

Stop and return to the artifacts. If a claim is not backed by Portolan output
or another local source, label it `claim-only`, `unknown`, `cannot_verify`, or
`not_assessed`.

## Legacy Go CLI Needed

Use legacy `portolan context prepare`, `portolan map`, and graph slicing only
when the operator explicitly asks for the compatibility route. The current
atlas path is the installed wrapper flow above.
