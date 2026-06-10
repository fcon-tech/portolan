# Codex / Claude Install Prompt (Harness-First)

Portable block — same skill as Cursor and OpenCode.

```text
PORTOLAN_PATH=<absolute Portolan checkout>
TARGET_PATH=<absolute local target>
ORIENT_PATH=<absolute empty orient output directory>
```

```text
Execute Portolan orient harness now (no confirmation unless paths missing).

1. Read PORTOLAN_PATH/harness/SKILL.md
2. PORTOLAN_PATH/scripts/orient-wizard.sh TARGET_PATH ORIENT_PATH --no-viewer --yes
3. Summarize hotspots.jsonl (top 5 by rank) and gaps.jsonl
4. Apply PORTOLAN_PATH/harness/guardrails/citation-rules.md

Optional viewer for human: cd PORTOLAN_PATH/viewer && npm install && npm run serve -- --bundle ORIENT_PATH

Legacy Go path only if asked: docs/harness/GO-FREEZE-POLICY.md
```
