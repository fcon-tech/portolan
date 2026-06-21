# OpenCode Install Prompt (Harness-First)

Replace variables with absolute paths, then send the block to the agent.

```text
PORTOLAN_PATH=<absolute path to Portolan checkout>
TARGET_ROOT=<absolute path to local target>
BUNDLE_DIR=<absolute path to empty bundle output directory>
```

```text
Install Portolan into TARGET_ROOT, then use the target-local Portolan wrappers.
Write the Portolan bundle to BUNDLE_DIR.

Rules:
- Use only local paths; no network unless I approve a specific recipe.
- Prefer BUNDLE_DIR under TARGET_ROOT/.portolan/atlas when the harness blocks external writes.
- Install first: "PORTOLAN_PATH/scripts/portolan-install.sh" "TARGET_ROOT" --harness opencode --bundle-dir "BUNDLE_DIR"
- Primary: "TARGET_ROOT/.portolan/bin/portolan-scan.sh" "TARGET_ROOT" "BUNDLE_DIR" --yes --skip-install --no-viewer
- Remove --skip-install only after explicit approval to install missing local OSS tools.
- Query with "TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" before answering.
- Cite repo.id, relationship.id, hotspot.id, gap.id, source paths, and producer_ref per harness/guardrails/citation-rules.md.
- Do not invent Portolan commands.

Report: visible repos/components, key relationships, top hotspots by rank,
gaps, source/report drill-downs, and viewer command:
"TARGET_ROOT/.portolan/bin/portolan-viewer.sh"
```
