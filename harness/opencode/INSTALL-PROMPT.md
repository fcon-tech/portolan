# OpenCode Install Prompt (Harness-First)

Replace variables with absolute paths, then send the block to the agent.

```text
PORTOLAN_PATH=<absolute path to Portolan checkout>
TARGET_PATH=<absolute path to local target>
ORIENT_PATH=<absolute path to empty orient output directory>
```

```text
Run the Portolan orient harness on TARGET_PATH. Write the orient bundle to
ORIENT_PATH. Follow PORTOLAN_PATH/harness/SKILL.md.

Rules:
- Use only local paths; no network unless I approve a specific recipe.
- Prefer ORIENT_PATH under PORTOLAN_PATH/.portolan/runs/ if your harness blocks external writes.
- Primary: PORTOLAN_PATH/scripts/orient-wizard.sh TARGET_PATH ORIENT_PATH --no-viewer --yes
- Manual fallback: recipes from PORTOLAN_PATH/harness/recipes/ + build-orient-bundle.sh
- Cite hotspot.id and producer_ref per harness/guardrails/citation-rules.md.
- Do not invent Portolan commands.

Report: hotspot count, top 5 hotspots by rank, gaps, and viewer command:
cd PORTOLAN_PATH/viewer && npm run serve -- --bundle ORIENT_PATH
```
