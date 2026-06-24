#!/usr/bin/env bash
# Print a copyable first-run prompt for asking an AI agent to build a Portolan atlas.
set -euo pipefail

PORTOLAN=""
TARGET_ROOT=""
BUNDLE_DIR=""
LANGUAGE="en"

usage() {
  cat <<'EOF'
usage: portolan-captain-prompt.sh --portolan URL_OR_PATH --target-root DIR [options]

Options:
  --portolan URL_OR_PATH   Portolan git URL or local checkout path.
  --target-root DIR        Local repo or multi-repo landscape root to inspect.
  --bundle-dir DIR         Optional bundle output directory.
                           Default: TARGET_ROOT/.portolan/atlas
  --language en|ru         Prompt language (default en).
  -h, --help               Show this help.

This command is read-only. It prints a prompt for Cursor, OpenCode, Codex,
Claude, or another shell-capable coding agent. The receiving agent still asks
before fetching a URL or installing missing local OSS tools.
EOF
}

fail() {
  echo "portolan-captain-prompt: FAIL: $*" >&2
  exit 1
}

require_opt_value() {
  local flag=$1 val=${2:-}
  if [[ -z "$val" || "$val" == -* ]]; then
    echo "option $flag requires a value" >&2
    usage >&2
    exit 2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --portolan) require_opt_value --portolan "${2:-}"; PORTOLAN="$2"; shift 2 ;;
    --target-root) require_opt_value --target-root "${2:-}"; TARGET_ROOT="$2"; shift 2 ;;
    --bundle-dir) require_opt_value --bundle-dir "${2:-}"; BUNDLE_DIR="$2"; shift 2 ;;
    --language) require_opt_value --language "${2:-}"; LANGUAGE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

[[ -n "$PORTOLAN" ]] || fail "--portolan is required"
[[ -n "$TARGET_ROOT" ]] || fail "--target-root is required"
case "$LANGUAGE" in
  en|ru) ;;
  *) fail "invalid --language: $LANGUAGE" ;;
esac

if [[ -z "$BUNDLE_DIR" ]]; then
  BUNDLE_DIR='${TARGET_ROOT}/.portolan/atlas'
fi

if [[ "$LANGUAGE" == "ru" ]]; then
  cat <<EOF
Ты работаешь как shell-capable coding agent. Построй Portolan atlas для локального target.

Входы:

PORTOLAN=$PORTOLAN
TARGET_ROOT=$TARGET_ROOT
BUNDLE_DIR=$BUNDLE_DIR

Задача:

1. Проверь, что TARGET_ROOT существует и это локальный путь. Не изменяй source files target.
2. Resolve PORTOLAN into an internal local checkout path:
   - если PORTOLAN это URL, сначала попроси явное разрешение fetch именно этого URL;
   - после разрешения клонируй или обнови его в локальном cache, например \$HOME/.cache/portolan-harness/portolan;
   - если PORTOLAN это локальный путь, используй его напрямую;
   - сохрани результат во внутреннюю переменную RESOLVED_PORTOLAN;
   - не проси у капитана отдельный PORTOLAN_PATH.
3. Если BUNDLE_DIR не абсолютный, резолви его относительно TARGET_ROOT. По умолчанию используй TARGET_ROOT/.portolan/atlas.
4. Установи target-local wrappers:
   "\$RESOLVED_PORTOLAN/scripts/portolan-install.sh" "\$TARGET_ROOT" --harness all --bundle-dir "\$BUNDLE_DIR"
5. После установки используй только "\$TARGET_ROOT/.portolan/bin" как интерфейс Portolan.
   Прочитай установленный harness guide, если он есть:
   - "\$TARGET_ROOT/AGENTS.md"
   - "\$TARGET_ROOT/.cursor/rules/portolan-atlas.mdc"
   - "\$TARGET_ROOT/CLAUDE.md"
6. Запусти doctor:
   "\$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "\$TARGET_ROOT" "\$BUNDLE_DIR" --skip-install --no-viewer
7. Если bundle path небезопасен или не writable, остановись и объясни причину.
8. Построй atlas без установки missing tools:
   "\$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "\$TARGET_ROOT" "\$BUNDLE_DIR" --yes --skip-install --no-viewer
   Убирай --skip-install только после явного разрешения operator.
9. Проверь status:
   "\$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "\$TARGET_ROOT" "\$BUNDLE_DIR"
10. Сгенерируй Q&A/drill-down evidence:
    "\$TARGET_ROOT/.portolan/bin/portolan-query-eval.sh" --run "\$BUNDLE_DIR"
11. Сгенерируй captain handoff:
    "\$TARGET_ROOT/.portolan/bin/portolan-captain-handoff.sh" "\$BUNDLE_DIR"
12. Читай напрямую только small control artifacts:
    receipt.json, captain-atlas-scorecard.json, captain-qna-eval.json,
    captain-handoff.md, captain-handoff.json.
13. Для фактов используй bounded queries, а не raw JSONL:
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" system-map --bundle "\$BUNDLE_DIR" --section overview
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" system-map --bundle "\$BUNDLE_DIR" --section components --limit 20
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "\$BUNDLE_DIR" --limit 20
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" relationships --bundle "\$BUNDLE_DIR" --limit 20
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "\$BUNDLE_DIR" --limit 20
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "\$BUNDLE_DIR" --limit 20
14. Докажи drill-down по одному representative source file. Предпочитай src/index.js line 1, если файл есть; иначе выбери небольшой source file из target:
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "\$BUNDLE_DIR" --path src/index.js --line 1 --limit 5

Ответь кратко:
- что видно в scope;
- какие relationships/hotspots/gaps важны;
- что показал selected-code drill-down;
- что остается unknown/cannot_verify/not_assessed;
- чем открыть atlas:
  "\$TARGET_ROOT/.portolan/bin/portolan-viewer.sh" --bundle "\$BUNDLE_DIR"
- какие bundle-query команды использовать дальше.
EOF
  exit 0
fi

cat <<EOF
You are a shell-capable coding agent. Build a Portolan atlas for the local target.

Inputs:

PORTOLAN=$PORTOLAN
TARGET_ROOT=$TARGET_ROOT
BUNDLE_DIR=$BUNDLE_DIR

Task:

1. Verify TARGET_ROOT exists and is local. Do not modify target source files.
2. Resolve PORTOLAN into an internal local checkout path:
   - if PORTOLAN is a URL, ask for explicit approval before fetching exactly that URL;
   - after approval, clone or update it in a local cache such as \$HOME/.cache/portolan-harness/portolan;
   - if PORTOLAN is a local path, use it directly;
   - keep the result in an internal RESOLVED_PORTOLAN variable;
   - do not ask the captain for a separate PORTOLAN_PATH.
3. If BUNDLE_DIR is not absolute, resolve it under TARGET_ROOT. Default to TARGET_ROOT/.portolan/atlas.
4. Install target-local wrappers:
   "\$RESOLVED_PORTOLAN/scripts/portolan-install.sh" "\$TARGET_ROOT" --harness all --bundle-dir "\$BUNDLE_DIR"
5. After install, use only "\$TARGET_ROOT/.portolan/bin" as the Portolan interface.
   Read the installed harness guide if present:
   - "\$TARGET_ROOT/AGENTS.md"
   - "\$TARGET_ROOT/.cursor/rules/portolan-atlas.mdc"
   - "\$TARGET_ROOT/CLAUDE.md"
6. Run doctor:
   "\$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "\$TARGET_ROOT" "\$BUNDLE_DIR" --skip-install --no-viewer
7. Stop and explain if the bundle path is unsafe or not writable.
8. Build the atlas without installing missing tools:
   "\$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "\$TARGET_ROOT" "\$BUNDLE_DIR" --yes --skip-install --no-viewer
   Remove --skip-install only after explicit operator approval.
9. Check status:
   "\$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "\$TARGET_ROOT" "\$BUNDLE_DIR"
10. Generate Q&A/drill-down evidence:
    "\$TARGET_ROOT/.portolan/bin/portolan-query-eval.sh" --run "\$BUNDLE_DIR"
11. Generate the captain handoff:
    "\$TARGET_ROOT/.portolan/bin/portolan-captain-handoff.sh" "\$BUNDLE_DIR"
12. Read only small control artifacts directly:
    receipt.json, captain-atlas-scorecard.json, captain-qna-eval.json,
    captain-handoff.md, captain-handoff.json.
13. Query facts through bounded queries, not raw JSONL:
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "\$BUNDLE_DIR" --limit 20
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" relationships --bundle "\$BUNDLE_DIR" --limit 20
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "\$BUNDLE_DIR" --limit 20
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "\$BUNDLE_DIR" --limit 20
14. Prove code drill-down for one representative source file. Prefer src/index.js line 1 when it exists; otherwise choose a small source file from the target:
    "\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "\$BUNDLE_DIR" --path src/index.js --line 1 --limit 5

Answer briefly with:
- visible scope;
- important relationships/hotspots/gaps;
- the selected-code drill-down result;
- what remains unknown/cannot_verify/not_assessed;
- how to open the atlas:
  "\$TARGET_ROOT/.portolan/bin/portolan-viewer.sh" --bundle "\$BUNDLE_DIR"
- the next bundle-query commands to use.
EOF
