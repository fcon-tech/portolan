# Agent Install Prompt

Use this prompt when you want an AI agent to run Portolan without hidden
scaffolding.

**Recommended (harness-first):** see [`harness/SKILL.md`](../../harness/SKILL.md)
and harness-specific prompts:

- [`harness/opencode/INSTALL-PROMPT.md`](../../harness/opencode/INSTALL-PROMPT.md)
- [`harness/codex-claude/INSTALL-PROMPT.md`](../../harness/codex-claude/INSTALL-PROMPT.md)

Replace variables with absolute local paths:

```text
PORTOLAN_PATH=<absolute path to Portolan checkout>
TARGET_PATH=<absolute path to local target>
BUNDLE_DIR=<absolute path to empty bundle output directory>
```

Then send:

```text
Run the Portolan harness on TARGET_PATH. Write the Portolan bundle to
BUNDLE_DIR. Execute now; do not ask unless a path is missing.

1. Read PORTOLAN_PATH/harness/SKILL.md
2. PORTOLAN_PATH/scripts/portolan-scan.sh TARGET_PATH BUNDLE_DIR --no-viewer --yes
   (or run recipes manually + build-portolan-bundle.sh if operator prefers)
3. Read hotspots.jsonl and gaps.jsonl; cite hotspot.id and producer_ref per
   PORTOLAN_PATH/harness/guardrails/citation-rules.md

If harness blocks external writes, use
PORTOLAN_PATH/.portolan/runs/<target-name> as BUNDLE_DIR.

Answer with:
1. Recipes run (verified/failed/blocked)
2. Top 5 hotspots by rank with evidence
3. Gaps and not_assessed surfaces
4. Viewer command: cd PORTOLAN_PATH/viewer && npm run serve -- --bundle BUNDLE_DIR
5. Unsupported claims avoided

Legacy Go CLI (optional): docs/harness/GO-FREEZE-POLICY.md
```

## Legacy Go install prompt

Use only when the operator explicitly needs `context prepare` / `map`:

```text
PORTOLAN_PATH=<checkout or binary>
TARGET_PATH=<target>
OUTPUT_PATH=<output>
```

Follow [`docs/agent/INSTALL.md`](INSTALL.md), bootstrap Go binary if needed,
run `context prepare` and `map` into OUTPUT_PATH. See git history or
`docs/product-claims.md` for artifact order.

For Russian-language runs, use [`INSTALL-PROMPT.ru.md`](INSTALL-PROMPT.ru.md).
