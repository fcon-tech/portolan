# Agent Examples

## Install Cursor And OpenCode Instructions

```bash
scripts/portolan-install.sh /path/to/target --harness all
```

This writes:

```text
/path/to/target/.cursor/rules/portolan-atlas.mdc
/path/to/target/AGENTS.md
```

Use `--harness cursor` or `--harness opencode` for one harness.

## Build An Atlas For A Single Repo

```bash
PORTOLAN_PATH=/path/to/portolan
TARGET_ROOT=/path/to/repo
BUNDLE_DIR=/path/to/repo/.portolan/atlas
"$PORTOLAN_PATH/scripts/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
```

Then read:

```text
$BUNDLE_DIR/manifest.json
$BUNDLE_DIR/atlas-facts.json
$BUNDLE_DIR/repo-profiles.json
$BUNDLE_DIR/hotspots.jsonl
$BUNDLE_DIR/gaps.jsonl
```

## Build An Atlas For A Multi-Repo Landscape

```bash
PORTOLAN_PATH=/path/to/portolan
TARGET_ROOT=/path/to/landscape
BUNDLE_DIR=/path/to/landscape/.portolan/atlas
"$PORTOLAN_PATH/scripts/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
```

Portolan inspects the target root, direct child Git repositories, and `repos/*`
Git repositories. If a complete inventory is required, ask the user for a local
selection, manifest, or explicit directory set; do not infer complete estate
coverage from visible local repos.

## Query Before Answering

```bash
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "auth" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo <repo-id> --path README.md --line 1
```

Use `symbol` when `symbol-index.jsonl` exists:

```bash
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" symbol --bundle "$BUNDLE_DIR" --repo <repo-id> --name Run --limit 20
```

## Open The Viewer

```bash
"$TARGET_ROOT/.portolan/bin/portolan-viewer.sh"
```

## Report Shape

```text
Run status:
- command:
- bundle directory:
- blockers:

What is visible:
- repositories/components:
- key relationships:
- key configuration/runtime/deployment surfaces:

Findings:
- relationships:
- duplication:
- configuration:
- technical debt:

Gaps:
- unknown:
- cannot_verify:
- not_assessed:

Drill-down:
- viewer/source routes:
- bundle-query commands:
```

Use evidence states. Do not hide gaps.

## Legacy Go Examples

Use legacy `portolan context prepare`, `portolan map`, and graph slicing only
when the operator explicitly asks for the legacy Go path. See
`docs/harness/GO-FREEZE-POLICY.md`.
