# Agent Examples

## Install Agent Instructions

```bash
scripts/portolan-install.sh /path/to/target --harness all --bundle-dir /path/to/target/.portolan/atlas
```

This writes:

```text
/path/to/target/.cursor/rules/portolan-atlas.mdc
/path/to/target/AGENTS.md
/path/to/target/CLAUDE.md
/path/to/target/.portolan/bin/
```

Use `--harness cursor`, `--harness opencode`, `--harness codex`, or
`--harness claude` for one harness. `--harness all` installs Cursor,
OpenCode/Codex-compatible `AGENTS.md`, Claude `CLAUDE.md`, and command
wrappers.

## First Run For A Single Repo

```bash
PORTOLAN=/path/to/portolan
TARGET_ROOT=/path/to/repo
BUNDLE_DIR=/path/to/repo/.portolan/atlas
PORTOLAN_PATH="$PORTOLAN"
"$PORTOLAN_PATH/scripts/portolan-install.sh" "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --dry-run "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "$TARGET_ROOT" "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-query-eval.sh" --run "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-captain-handoff.sh" "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-viewer.sh"
```

Then read:

```text
$BUNDLE_DIR/receipt.json
$BUNDLE_DIR/captain-atlas-scorecard.json
$BUNDLE_DIR/captain-qna-eval.json
$BUNDLE_DIR/captain-handoff.md
$BUNDLE_DIR/captain-handoff.json
$BUNDLE_DIR/manifest.json
$BUNDLE_DIR/atlas-facts.json
$BUNDLE_DIR/repo-profiles.json
```

Do not load raw `hotspots.jsonl`, `relationships.jsonl`, or `gaps.jsonl` into
chat for large estates. Use `portolan-bundle-query.sh` for bounded records.

## First Run For A Multi-Repo Landscape

```bash
PORTOLAN=/path/to/portolan
TARGET_ROOT=/path/to/landscape
BUNDLE_DIR=/path/to/landscape/.portolan/atlas
PORTOLAN_PATH="$PORTOLAN"
"$PORTOLAN_PATH/scripts/portolan-install.sh" "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --dry-run "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "$TARGET_ROOT" "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-viewer.sh"
```

Portolan inspects the target root, direct child Git repositories, and `repos/*`
Git repositories. If a complete inventory is required, ask the user for a local
selection, manifest, or explicit directory set; do not infer complete estate
coverage from visible local repos.

Run scan shorthand only after install, doctor, and dry-run have succeeded or
their blockers are recorded:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
```

## Query Before Answering

```bash
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" overview --bundle "$BUNDLE_DIR" --limit 8
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "auth" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo <repo-id> --path README.md --line 1
```

Use `claim-check` before answering a human or developer claim about a
relationship. Treat `cannot_verify` and `not_assessed` as degraded evidence, not
as proof that the relationship is false:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" claim-check --bundle "$BUNDLE_DIR" --from <repo-or-component> --to <repo-or-component> --kind depends-on --limit 8
```

Use `selected-code` when the user highlights a file, line, or symbol in the
coding harness:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "$BUNDLE_DIR" --repo <repo-id> --path src/server.ts --line 42 --limit 8
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "$BUNDLE_DIR" --repo <repo-id> --path src/server.ts --symbol createServer --line 42 --limit 8
```

Use `symbol` when `symbol-index.jsonl` exists. `--path` can be used without
`--name` to list bounded definitions in a selected file:

```bash
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" symbol --bundle "$BUNDLE_DIR" --repo <repo-id> --name Run --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" symbol --bundle "$BUNDLE_DIR" --repo <repo-id> --path src/server.ts --limit 20
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

Use evidence states. Do not hide gaps. Prefer `routes` and `follow_up_queries`
from query output when handing a captain to the atlas, source snippet, or
drill-down API route.

## Legacy Go Examples

Use legacy `portolan context prepare`, `portolan map`, and graph slicing only
when the operator explicitly asks for the compatibility route. See
`docs/harness/GO-FREEZE-POLICY.md`.
