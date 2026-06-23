# OpenCode Install Prompt (Harness-First)

For public first-run use, prefer the shared captain prompt generator:

```bash
scripts/portolan-captain-prompt.sh \
  --portolan <Portolan git URL or local checkout path> \
  --target-root <target-root>
```

Use this harness-specific block only as a diagnostic fallback when the shared
prompt cannot be used.

```text
PORTOLAN=<Portolan git URL or absolute path to local Portolan checkout>
TARGET_ROOT=<absolute path to local target>
```

```text
Install Portolan into TARGET_ROOT, then use the target-local Portolan wrappers.
Write the Portolan bundle to BUNDLE_DIR, defaulting to
TARGET_ROOT/.portolan/atlas when BUNDLE_DIR was not supplied.

Rules:
- Use only local paths; no network unless I approve a specific recipe.
- If PORTOLAN is a URL, ask for approval to fetch exactly that URL and clone it
  into a local cache. If PORTOLAN is a path, use it directly. Keep the resolved
  local path in an internal RESOLVED_PORTOLAN variable; do not ask the captain
  for a separate PORTOLAN_PATH.
- Set BUNDLE_DIR to TARGET_ROOT/.portolan/atlas unless the captain supplied an explicit safe override.
- Install first: "$RESOLVED_PORTOLAN/scripts/portolan-install.sh" "$TARGET_ROOT" --harness opencode --bundle-dir "$BUNDLE_DIR"
- Doctor first: "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
- Show the plan before scanning: "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --dry-run "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
- Primary scan after doctor and dry-run: "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
- Remove --skip-install only after explicit approval to install missing local OSS tools.
- Run bundle status after scan: "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "$TARGET_ROOT" "$BUNDLE_DIR"
- Read "$BUNDLE_DIR/receipt.json" and "$BUNDLE_DIR/captain-atlas-scorecard.json" after scan and preserve producer states/gaps, local-first flags, duration, first useful captain insight, next actions, and viewer handoff.
- Generate and read the deterministic Q&A/drill-down artifact: "$TARGET_ROOT/.portolan/bin/portolan-query-eval.sh" --run "$BUNDLE_DIR"; then read "$BUNDLE_DIR/captain-qna-eval.json".
- Build and read the captain handoff artifact: "$TARGET_ROOT/.portolan/bin/portolan-captain-handoff.sh" "$BUNDLE_DIR"; then read "$BUNDLE_DIR/captain-handoff.md" and keep "$BUNDLE_DIR/captain-handoff.json" as machine-readable run status.
- Query with "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" before answering.
- For selected code, query: "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "$BUNDLE_DIR" --repo "<repo-id>" --path "<path>" --line 1 --limit 20
- Cite local bundle record ids and paths directly: `repo.id`, `relationship.id`,
  `hotspot.id`, `gap.id`, source paths, and `producer_ref` when present.
- Do not invent Portolan commands.

Report: visible repos/components, key relationships, top hotspots by rank,
gaps, source/report drill-downs, and viewer command:
"$TARGET_ROOT/.portolan/bin/portolan-viewer.sh"
```
