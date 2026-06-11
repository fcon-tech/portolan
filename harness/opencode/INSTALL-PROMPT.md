# OpenCode Install Prompt (Harness-First)

Replace variables with absolute paths, then send the block to the agent.

```text
PORTOLAN_PATH=<absolute path to Portolan checkout>
TARGET_PATH=<absolute path to local target>
BUNDLE_DIR=<absolute path to empty bundle output directory>
```

```text
Run the Portolan harness on TARGET_PATH. Write the Portolan bundle to
BUNDLE_DIR. Follow PORTOLAN_PATH/harness/SKILL.md.

Rules:
- Use only local paths; no network unless I approve a specific recipe.
- Prefer BUNDLE_DIR under PORTOLAN_PATH/.portolan/runs/ if your harness blocks external writes.
- Primary: PORTOLAN_PATH/scripts/portolan-scan.sh TARGET_PATH BUNDLE_DIR --no-viewer --yes
- Manual fallback: recipes from PORTOLAN_PATH/harness/recipes/ + build-portolan-bundle.sh
- Cite hotspot.id and producer_ref per harness/guardrails/citation-rules.md.
- Do not invent Portolan commands.

Report: hotspot count, top 5 hotspots by rank, gaps, and viewer command:
cd PORTOLAN_PATH/viewer && npm run serve -- --bundle BUNDLE_DIR
```
