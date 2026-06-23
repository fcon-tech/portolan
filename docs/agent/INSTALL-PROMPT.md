# Agent Install Prompt

Use this prompt when you want an AI agent to run Portolan without hidden
setup.

**Recommended path:** install target-local wrappers, then run the atlas through
`TARGET_ROOT/.portolan/bin`.

To generate a copyable first-run prompt from the two captain inputs:

```bash
scripts/portolan-captain-prompt.sh \
  --portolan <Portolan git URL or local checkout path> \
  --target-root <absolute path to local target>
```

Harness-specific prompt variants:

- [`harness/cursor/portolan-harness.mdc`](../../harness/cursor/portolan-harness.mdc)
- [`harness/opencode/INSTALL-PROMPT.md`](../../harness/opencode/INSTALL-PROMPT.md)
- [`harness/codex-claude/INSTALL-PROMPT.md`](../../harness/codex-claude/INSTALL-PROMPT.md)

Required captain inputs are `PORTOLAN` and `TARGET_ROOT`. `BUNDLE_DIR` is an
agent-derived default: use `$TARGET_ROOT/.portolan/atlas` unless the captain
explicitly supplies a safe override.

```text
PORTOLAN=<Portolan git URL or absolute local Portolan checkout>
TARGET_ROOT=<absolute path to local target>
```

Then send:

```text
Use Portolan as an agent-installable landscape atlas layer for TARGET_ROOT.
Default BUNDLE_DIR to TARGET_ROOT/.portolan/atlas. Execute now; ask
only if PORTOLAN or TARGET_ROOT is missing, the bundle path is not safe to
create/replace, or local OSS tool execution needs operator approval.

1. Resolve PORTOLAN first. If it is a URL, ask for approval to fetch exactly
   that URL and clone it into a local cache. If it is a path, use it directly.
   Keep the resolved local path in an internal `RESOLVED_PORTOLAN` variable; do
   not ask the captain for a separate `PORTOLAN_PATH`.
2. Set BUNDLE_DIR to TARGET_ROOT/.portolan/atlas unless the captain supplied an
   explicit safe override.
3. Install target-local Portolan wrappers:
   "$RESOLVED_PORTOLAN/scripts/portolan-install.sh" "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
4. Run doctor before building:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
   Report target shape, bundle writability, available/missing tools, rough scan
   size, and local-first/no-network expectations. Stop if the bundle path is
   unsafe or not writable.
5. If I ask what Portolan will do, show the dry-run plan:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --dry-run "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
6. Run the bundle build through the installed wrapper:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
   Remove --skip-install only after explicit operator approval to install
   missing OSS tools; keep missing tools as not_assessed/cannot_verify gaps by
   default.
7. Run bundle status through the installed wrapper:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "$TARGET_ROOT" "$BUNDLE_DIR"
8. Read "$BUNDLE_DIR/receipt.json" and include command, target, bundle,
   producer states/gaps, local-first flags, duration, and viewer handoff in the
   run status.
9. Read "$BUNDLE_DIR/captain-atlas-scorecard.json" and report its first useful
   captain insight, next actions, acceptance assertions, and kill/pack/build
   recommendation.
10. Generate and read the deterministic Q&A/drill-down artifact:
   "$TARGET_ROOT/.portolan/bin/portolan-query-eval.sh" --run "$BUNDLE_DIR"
   Then include "$BUNDLE_DIR/captain-qna-eval.json" status in the handoff.
11. Build and read the captain handoff artifact:
   "$TARGET_ROOT/.portolan/bin/portolan-captain-handoff.sh" "$BUNDLE_DIR"
   Use "$BUNDLE_DIR/captain-handoff.md" as the final captain summary and keep
   "$BUNDLE_DIR/captain-handoff.json" as machine-readable run status.
12. Read only the small control artifacts directly before answering:
   - receipt.json
   - captain-atlas-scorecard.json
   - captain-qna-eval.json
   - captain-handoff.md
   - captain-handoff.json
   Do not load raw relationships/hotspots/gaps JSONL into chat; large estates can
   produce huge files. Query landscape facts at answer time instead:
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section components --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section edges --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "<term>" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo "<repo-id>" --path "<path>" --line 1
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "$BUNDLE_DIR" --repo "<repo-id>" --path "<path>" --line 1 --limit 20
13. For selected code, map the file/symbol back into the atlas:
   - query selected-code first for a bounded context packet;
   - query search/source for the selected path when more detail is needed;
   - query symbol when symbol-index.jsonl exists;
   - query hotspots --repo <repo-id>, gaps, and relationships for surrounding context;
   - answer with links to viewer drill-down/source routes.

If the harness blocks external writes, use TARGET_ROOT/.portolan/atlas as
BUNDLE_DIR.

Do not read or depend on external Portolan checkout files during the atlas run.
The installed wrappers and target AGENTS/Cursor rule are the active interface.

Answer with:
1. Scope: repos/components visible in the atlas
2. Landscape: key relationships, hubs, and surfaces
3. Pain: top hotspots and why they matter
4. Gaps: unknown / cannot_verify / not_assessed surfaces
5. Drill-down: source/report/viewer routes for material claims
6. Captain handoff: summarize captain-handoff.md and mention captain-handoff.json
7. Agent handoff: exact bundle-query commands used or recommended next
8. Viewer URL/command:
   "$TARGET_ROOT/.portolan/bin/portolan-viewer.sh"

Legacy Go CLI (optional): docs/harness/GO-FREEZE-POLICY.md
```

## Legacy Go Compatibility Prompt

Use only when the operator explicitly needs the compatibility route for
`context prepare` / `map`:

```text
PORTOLAN=<checkout or binary>
TARGET_ROOT=<target>
LEGACY_OUTPUT_DIR=<output>
```

Follow [`docs/agent/INSTALL.md`](INSTALL.md), bootstrap the Go binary if needed,
and write compatibility artifacts into `LEGACY_OUTPUT_DIR`.

For Russian-language runs, use [`INSTALL-PROMPT.ru.md`](INSTALL-PROMPT.ru.md).
