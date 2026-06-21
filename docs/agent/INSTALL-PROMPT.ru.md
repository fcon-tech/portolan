# Prompt Для Установки Portolan Агентом

Используй этот prompt, когда нужно дать агенту Portolan как локальный atlas
layer без скрытых подсказок.

Замени переменные на абсолютные локальные пути:

```text
PORTOLAN_PATH=<absolute path to Portolan checkout>
TARGET_ROOT=<absolute path to local repo or multi-repo landscape>
BUNDLE_DIR=<absolute path to empty bundle output directory>
```

Если нужно установить инструкции Cursor/OpenCode в target project:

```bash
"$PORTOLAN_PATH/scripts/portolan-install.sh" "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
```

Потом отправь агенту:

```text
Используй Portolan как agent-installable atlas layer для TARGET_ROOT.
Запиши bundle в BUNDLE_DIR. Выполняй сейчас; спрашивай только если путь
отсутствует, BUNDLE_DIR небезопасно создать/заменить, или запуск/установка
локального OSS tool требует подтверждения оператора.

1. Установи target-local wrappers:
   "$PORTOLAN_PATH/scripts/portolan-install.sh" "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
2. Сначала собери bundle через установленный wrapper:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
   Убирай --skip-install только после явного разрешения установить
   отсутствующие OSS tools; по умолчанию сохраняй missing tools как
   not_assessed/cannot_verify gaps.
3. Перед ответом прочитай atlas bundle:
   - manifest.json
   - atlas-facts.json
   - repo-profiles.json
   - relationships.jsonl
   - hotspots.jsonl / hotspots-full.jsonl
   - gaps.jsonl
   - atlas-surface-content.json
4. Не загружай весь bundle в чат. Запрашивай данные через bundle-query:
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section components --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section edges --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "<term>" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo "<repo-id>" --path "<path>" --line 1
5. Для выделенного кода свяжи файл/символ с atlas:
   - найди repo-id в repos.json;
   - query source/search/symbol для выбранного path/name;
   - query hotspots --repo <repo-id>, gaps и relationships для окружающего контекста;
   - дай ссылки на viewer/source routes.

Если harness запрещает внешний output, используй
TARGET_ROOT/.portolan/atlas как BUNDLE_DIR.

Не читай и не используй внешние файлы Portolan checkout во время atlas run.
Установленные wrappers и target AGENTS/Cursor rule — активный интерфейс.

Ответь:
1. Scope: какие repos/components видны в atlas
2. Landscape: ключевые relationships, hubs, surfaces
3. Pain: top hotspots и почему они важны
4. Gaps: unknown / cannot_verify / not_assessed surfaces
5. Drill-down: source/report/viewer routes для существенных claims
6. Agent handoff: точные bundle-query команды, которые использовал или
   рекомендуешь следующему агенту
7. Viewer URL/command:
   "$TARGET_ROOT/.portolan/bin/portolan-viewer.sh"
```

Legacy Go CLI используй только если оператор явно просит `context prepare` /
`map`: [`docs/agent/INSTALL.ru.md`](INSTALL.ru.md).
