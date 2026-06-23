# Codex / Claude Install Prompt (Harness-First)

For public first-run use, prefer the shared captain prompt generator:

```bash
scripts/portolan-captain-prompt.sh \
  --portolan <Portolan git URL or local checkout path> \
  --target-root <target-root>
```

Use this portable block only as a diagnostic fallback when the shared prompt
cannot be used.

```text
PORTOLAN=<Portolan git URL or absolute local Portolan checkout>
TARGET_ROOT=<absolute local target>
```

```text
Install Portolan into TARGET_ROOT and execute the installed target-local
wrappers now. Default BUNDLE_DIR to TARGET_ROOT/.portolan/atlas unless the
captain supplied an explicit safe override.

1. Resolve PORTOLAN first. If it is a URL, ask for approval to fetch exactly
   that URL and clone it into a local cache. If it is a path, use it directly.
   Keep the resolved local path in an internal RESOLVED_PORTOLAN variable; do
   not ask the captain for a separate PORTOLAN_PATH.
2. Set BUNDLE_DIR to TARGET_ROOT/.portolan/atlas unless the captain supplied an explicit safe override.
3. "$RESOLVED_PORTOLAN/scripts/portolan-install.sh" "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
4. Run doctor first:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
5. Show the plan before scanning:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --dry-run "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
6. Build the first atlas after doctor and dry-run:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
   Remove --skip-install only after explicit approval to install missing local OSS tools.
7. Run bundle status:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "$TARGET_ROOT" "$BUNDLE_DIR"
8. Read "$BUNDLE_DIR/receipt.json" and "$BUNDLE_DIR/captain-atlas-scorecard.json"; include producer states/gaps, local-first flags, duration, first useful captain insight, next actions, and viewer handoff in your run status
9. Generate and read the deterministic Q&A/drill-down artifact:
   "$TARGET_ROOT/.portolan/bin/portolan-query-eval.sh" --run "$BUNDLE_DIR"
   Then include "$BUNDLE_DIR/captain-qna-eval.json" status in the handoff.
10. Build and read the captain handoff artifact:
   "$TARGET_ROOT/.portolan/bin/portolan-captain-handoff.sh" "$BUNDLE_DIR"
   Use "$BUNDLE_DIR/captain-handoff.md" as the human summary and keep
   "$BUNDLE_DIR/captain-handoff.json" as machine-readable run status.
11. Query with "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" before answering
12. For selected code, query:
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "$BUNDLE_DIR" --repo "<repo-id>" --path "<path>" --line 1 --limit 20
13. Summarize visible repos/components, key relationships, top hotspots, gaps, report/source drill-downs, captain handoff, and viewer handoff
14. Cite bundle record ids or source paths for material claims

Optional viewer for human:
"$TARGET_ROOT/.portolan/bin/portolan-viewer.sh"

Legacy Go path only if asked: docs/harness/GO-FREEZE-POLICY.md
```
