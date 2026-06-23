# Prompt Для Установки Portolan Агентом

Используй этот prompt, когда нужно дать агенту Portolan как локальный atlas
layer без скрытых подсказок.

Обязательные входы капитана: `PORTOLAN` и `TARGET_ROOT`. `BUNDLE_DIR` не надо
просить заранее: по умолчанию используй `$TARGET_ROOT/.portolan/atlas`, если
капитан явно не передал безопасный override.

```text
PORTOLAN=<Portolan git URL or absolute local Portolan checkout>
TARGET_ROOT=<absolute path to local repo or multi-repo landscape>
```

Предпочтительный путь - сгенерировать copyable first-run prompt:

```bash
scripts/portolan-captain-prompt.sh \
  --portolan <Portolan git URL or local checkout path> \
  --target-root <target-root>
```

Потом отправь агенту:

```text
Используй Portolan как agent-installable atlas layer для TARGET_ROOT.
Запиши bundle в BUNDLE_DIR, по умолчанию TARGET_ROOT/.portolan/atlas, если
капитан не передал явный безопасный override. Выполняй сейчас; спрашивай только
если PORTOLAN или TARGET_ROOT отсутствует, bundle path небезопасно
создать/заменить, или запуск/установка локального OSS tool требует
подтверждения оператора.

1. Сначала resolve PORTOLAN. Если это URL, спроси разрешение скачать ровно
   этот URL и клонируй его в локальный cache. Если это путь, используй его
   напрямую. Сохрани resolved local path во внутреннюю переменную
   RESOLVED_PORTOLAN; не проси у капитана отдельный PORTOLAN_PATH.
2. Установи BUNDLE_DIR в TARGET_ROOT/.portolan/atlas, если капитан не передал
   явный безопасный override.
3. Установи target-local wrappers:
   "$RESOLVED_PORTOLAN/scripts/portolan-install.sh" "$TARGET_ROOT" --harness all --bundle-dir "$BUNDLE_DIR"
4. Сначала проверь окружение:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
5. Затем покажи план без записи полного bundle:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --dry-run "$TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer
6. После doctor и dry-run собери bundle через установленный wrapper:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
   Убирай --skip-install только после явного разрешения установить
   отсутствующие OSS tools; по умолчанию сохраняй missing tools как
   not_assessed/cannot_verify gaps.
7. Проверь статус bundle через установленный wrapper:
   "$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "$TARGET_ROOT" "$BUNDLE_DIR"
8. Перед ответом прочитай receipt и scorecard:
   - receipt.json
   - captain-atlas-scorecard.json
9. Сгенерируй и прочитай deterministic Q&A/drill-down artifact:
   "$TARGET_ROOT/.portolan/bin/portolan-query-eval.sh" --run "$BUNDLE_DIR"
   - captain-qna-eval.json
10. Сгенерируй и прочитай captain handoff:
   "$TARGET_ROOT/.portolan/bin/portolan-captain-handoff.sh" "$BUNDLE_DIR"
   - captain-handoff.md
   - captain-handoff.json
11. Перед ответом напрямую читай только маленькие control artifacts:
   - receipt.json
   - captain-atlas-scorecard.json
   - captain-qna-eval.json
   - captain-handoff.md
   - captain-handoff.json
   Не загружай raw relationships/hotspots/gaps JSONL в чат: на больших corpus
   они могут быть огромными. Факты landscape запрашивай через bundle-query:
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section components --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section edges --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "<term>" --limit 20
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo "<repo-id>" --path "<path>" --line 1
   "$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "$BUNDLE_DIR" --repo "<repo-id>" --path "<path>" --line 1 --limit 20
12. Для выделенного кода свяжи файл/символ с atlas:
   - найди repo-id в repos.json;
   - сначала query selected-code для bounded context packet;
   - query source/search/symbol для выбранного path/name, когда нужно больше деталей;
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

Legacy Go CLI используй только если оператор явно просит compatibility route
для `context prepare` / `map`: [`docs/agent/INSTALL.ru.md`](INSTALL.ru.md).
