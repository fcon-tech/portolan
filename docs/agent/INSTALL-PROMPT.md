# Agent Install Prompt

Use this prompt when you want an AI agent to run Portolan without hidden
setup.

**Recommended (harness-first):** see [`harness/SKILL.md`](../../harness/SKILL.md)
and harness-specific prompts:

- [`harness/cursor/portolan-harness.mdc`](../../harness/cursor/portolan-harness.mdc)
- [`harness/opencode/INSTALL-PROMPT.md`](../../harness/opencode/INSTALL-PROMPT.md)
- [`harness/codex-claude/INSTALL-PROMPT.md`](../../harness/codex-claude/INSTALL-PROMPT.md)

To install harness instructions into a target project:

```bash
"$PORTOLAN_PATH/scripts/portolan-install.sh" "$TARGET_ROOT" --harness all
```

Replace variables with absolute local paths:

```text
PORTOLAN_PATH=<absolute path to Portolan checkout>
TARGET_ROOT=<absolute path to local target>
BUNDLE_DIR=<absolute path to empty bundle output directory>
```

Then send:

```text
Use Portolan as an agent-installable landscape atlas layer for TARGET_ROOT.
Write the Portolan bundle to BUNDLE_DIR. Execute now; ask only if a path is
missing, BUNDLE_DIR is not safe to create/replace, or local OSS tool execution
needs operator approval.

1. Read PORTOLAN_PATH/harness/SKILL.md
2. Run the bundle build first:
   "$PORTOLAN_PATH/scripts/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
   Remove --skip-install only after explicit operator approval to install
   missing OSS tools; keep missing tools as not_assessed/cannot_verify gaps by
   default.
3. Read the atlas bundle before answering:
   - manifest.json
   - atlas-facts.json
   - repo-profiles.json
   - relationships.jsonl
   - hotspots.jsonl / hotspots-full.jsonl
   - gaps.jsonl
4. Query at answer time instead of loading everything into chat:
   "$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
   "$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
   "$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
   "$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
   "$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "<term>" --limit 20
   "$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo "<repo-id>" --path "<path>" --line 1
5. For selected code, map the file/symbol back into the atlas:
   - query search/source for the selected path;
   - query symbol when symbol-index.jsonl exists;
   - query hotspots --repo <repo-id>, gaps, and relationships for surrounding context;
   - answer with links to viewer drill-down/source routes.

If the harness blocks external writes, use TARGET_ROOT/.portolan/atlas as
BUNDLE_DIR.

Answer with:
1. Scope: repos/components visible in the atlas
2. Landscape: key relationships, hubs, and surfaces
3. Pain: top hotspots and why they matter
4. Gaps: unknown / cannot_verify / not_assessed surfaces
5. Drill-down: source/report/viewer routes for material claims
6. Agent handoff: exact bundle-query commands used or recommended next
7. Viewer URL/command:
   "$TARGET_ROOT/.portolan/bin/portolan-viewer.sh"

Legacy Go CLI (optional): docs/harness/GO-FREEZE-POLICY.md
```

## Legacy Go install prompt

Use only when the operator explicitly needs `context prepare` / `map`:

```text
PORTOLAN_PATH=<checkout or binary>
TARGET_ROOT=<target>
LEGACY_OUTPUT_DIR=<output>
```

Follow [`docs/agent/INSTALL.md`](INSTALL.md), bootstrap Go binary if needed,
run `context prepare` and `map` into LEGACY_OUTPUT_DIR. See git history or
`docs/product-claims.md` for artifact order.

For Russian-language runs, use [`INSTALL-PROMPT.ru.md`](INSTALL-PROMPT.ru.md).
