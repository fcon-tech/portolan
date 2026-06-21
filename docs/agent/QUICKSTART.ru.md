# Быстрый Старт Для Агента

Используй это, когда пользователь просит с помощью Portolan составить atlas,
осмотреть, проверить или объяснить локальный target.

Если пользователь просит другого агента "поставь Portolan", используй
copyable prompt в `docs/agent/INSTALL-PROMPT.ru.md`.

Для Cursor, OpenCode, install/build и маршрута human-facing документации
сначала прочитай `docs/onboarding.md`, если собираешься делать broad claims о
harness support. Cursor UI не доказан headless Cursor Agent CLI evidence.
OpenCode должен писать bundle внутри target, если permission mode явно не
разрешает другой output root.

## Какие Inputs Нужны

- Checkout Portolan.
- Локальный target root для чтения.
- BUNDLE_DIR для Portolan bundle.

Не используй network, credentials, clone или mutation target без явного
разрешения пользователя.

## 1. Предпочитай Harness Atlas Path

Основной маршрут не требует legacy Go CLI:

```bash
"$PORTOLAN_PATH/scripts/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
```

Убирай `--skip-install` только после явного разрешения установить missing local
OSS tools.

После scan прочитай:

- `manifest.json`
- `atlas-facts.json`
- `repo-profiles.json`
- `relationships.jsonl`
- `hotspots.jsonl`
- `hotspots-full.jsonl`
- `gaps.jsonl`
- `atlas-surface-content.json`

Открой viewer, когда нужен human-readable atlas:

```bash
cd "$PORTOLAN_PATH/viewer"
node scripts/build-static.js
node scripts/serve.js --bundle "$BUNDLE_DIR"
```

Query перед ответом:

```bash
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" search --bundle "$BUNDLE_DIR" --q "auth" --limit 20
"$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo <repo-id> --path README.md --line 1
```

## 2. Привяжи Selected Code К Atlas

Когда пользователь выделяет файл, symbol или subsystem в coding-agent UI:

1. Определи selected path и repo root.
2. Query `source` для bounded snippet.
3. Query `search` или `symbol`, если индексы есть.
4. Query `hotspots --repo <repo-id>` для локальной боли вокруг repo.
5. Query `relationships` для видимых связей с другими repo.
6. Явно скажи gaps, если runtime/config/vendor relationships отсутствуют.

Не выводи runtime calls из static dependency или source-search результатов.

## 3. Legacy Go Path Только Когда Нужен

Используй legacy Go path только если пользователь явно просит
`context prepare`, `map` или старые map artifacts.

Из source checkout Portolan:

```bash
cd <portolan-checkout>
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

Context:

```bash
.portolan/bin/portolan context prepare --root <target-root> --out <output-dir>/context --profile agent
```

Legacy map:

```bash
.portolan/bin/portolan map --root <target-root> --out <output-dir>/map
```

## 4. Отвечай По Evidence

Отчет должен включать:

1. Run status и blockers
2. Видимые repositories или scope
3. Relationships
4. Duplication
5. Configuration surfaces
6. Technical-debt candidates
7. Unknown и `cannot_verify`
8. Not assessed

Не придумывай facts, которых нет в Portolan artifacts.

## 5. Сохраняй Границы

- Source/config duplicate clusters являются evidence, а не refactoring order.
- Локально видимый scope не доказывает complete estate coverage.
- Runtime topology требует runtime observations.
- OSS tools являются valid local dependencies, когда установлены и явно
  requested, но output recipes не evidence, пока outputs не существуют.
- `not_assessed` - нормальный результат.
