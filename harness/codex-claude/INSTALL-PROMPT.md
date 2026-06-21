# Codex / Claude Install Prompt (Harness-First)

Portable block — same skill as Cursor and OpenCode.

```text
PORTOLAN_PATH=<absolute Portolan checkout>
TARGET_ROOT=<absolute local target>
BUNDLE_DIR=<absolute empty bundle output directory>
```

```text
Install Portolan into TARGET_ROOT and execute the installed target-local
wrappers now (no confirmation unless paths are missing).

1. "PORTOLAN_PATH/scripts/portolan-install.sh" "TARGET_ROOT" --harness all --bundle-dir "BUNDLE_DIR"
2. "TARGET_ROOT/.portolan/bin/portolan-scan.sh" "TARGET_ROOT" "BUNDLE_DIR" --yes --skip-install --no-viewer
   Remove --skip-install only after explicit approval to install missing local OSS tools.
3. Query with "TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" before answering
4. Summarize visible repos/components, key relationships, top hotspots, and gaps
5. Cite bundle record ids or source paths for material claims

Optional viewer for human:
"TARGET_ROOT/.portolan/bin/portolan-viewer.sh"

Legacy Go path only if asked: docs/harness/GO-FREEZE-POLICY.md
```
