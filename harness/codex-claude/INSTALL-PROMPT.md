# Codex / Claude Install Prompt (Harness-First)

Portable block — same skill as Cursor and OpenCode.

```text
PORTOLAN_PATH=<absolute Portolan checkout>
TARGET_ROOT=<absolute local target>
BUNDLE_DIR=<absolute empty bundle output directory>
```

```text
Execute Portolan harness now (no confirmation unless paths missing).

1. Read PORTOLAN_PATH/harness/SKILL.md
2. "PORTOLAN_PATH/scripts/portolan-scan.sh" "TARGET_ROOT" "BUNDLE_DIR" --yes --skip-install --no-viewer
   Remove --skip-install only after explicit approval to install missing local OSS tools.
3. Query with PORTOLAN_PATH/scripts/portolan-bundle-query.sh before answering
4. Summarize visible repos/components, key relationships, top hotspots, and gaps
5. Apply PORTOLAN_PATH/harness/guardrails/citation-rules.md

Optional viewer for human:
"TARGET_ROOT/.portolan/bin/portolan-viewer.sh"

Legacy Go path only if asked: docs/harness/GO-FREEZE-POLICY.md
```
