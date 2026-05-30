# Быстрый Старт Для Агента

Используй это, когда пользователь просит с помощью Portolan составить map,
осмотреть, проверить или объяснить локальный target.

Если пользователь просит другого агента "поставь Portolan", используй
copyable prompt в `docs/agent/INSTALL-PROMPT.ru.md`.

Для Cursor, OpenCode, install/build и маршрута human-facing документации
сначала прочитай `docs/onboarding.md`, если собираешься делать broad claims о
harness support. Cursor UI не доказан headless Cursor Agent CLI evidence.
OpenCode default permissions работают с repo-local output path внутри checkout
Portolan; зафиксированный external-output default-permission lane failed.

## Какие Inputs Нужны

- Checkout Portolan или установленный бинарь `portolan`.
- Локальный target root для чтения.
- Output directory для Portolan artifacts.

Не используй network, credentials, clone или mutation target без явного
разрешения пользователя.

## 1. Найди Команду Portolan

Если `portolan` уже установлен:

```bash
portolan --version
```

Из source checkout Portolan собери repo-local binary:

```bash
cd <portolan-checkout>
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

Используй `go run` только как fallback из checkout Portolan:

```bash
go run ./cmd/portolan --version
```

## 2. Подготовь Context Для Агента

```bash
portolan context prepare --root <target-root> --out <output-dir>/context --profile cursor
```

Если используешь repo-local binary:

```bash
.portolan/bin/portolan context prepare --root <target-root> --out <output-dir>/context --profile cursor
```

Перед broad answer прочитай:

- `agent-brief.md`
- `answer-contract.md`
- `query-plan.md`
- `evidence-index.jsonl`
- `repos.json`
- `tool-registry.json`
- `oss-plan.json`
- `gaps.jsonl`

## 3. Создай Map, Если Нужно

```bash
portolan map --root <target-root> --out <output-dir>/map
```

Если target содержит локальный `selection.json`, проверь его и используй для
map вместо изобретения новой selection:

```bash
portolan selection validate --selection <target-root>/selection.json
portolan map --selection <target-root>/selection.json --out <output-dir>/map
```

Если selection validation падает, запиши validation command как `failed`, затем
используй `map --root <target-root>`, если пользователь не просил остановиться
на invalid selection.

Перед map-backed claims прочитай:

- `run.json`
- `coverage.json`
- `summary.json`
- `graph-index.json`
- `findings.jsonl`
- `map.md`

До открытия большого `graph.json` используй bounded read-only queries:

```bash
portolan query findings --bundle <output-dir>/map --kind relationships --limit 20
portolan query gaps --bundle <output-dir>/map --limit 20
```

`query findings` нужен для records by kind: `relationships`, `duplication`,
`configuration` или `technical-debt`. `query gaps` нужен, чтобы объяснить
`unknown`, `cannot_verify` или `not_assessed` перед ответом. `claim-only`
records остаются доступны через `query findings` by kind. Query output
включает stable `portolan://` references для цитирования.

Открывай `graph.json` только если bounded files, query output и graph slices
недостаточны.

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
- OSS producers являются valid local dependencies, когда установлены и явно
  requested, но producer plans не evidence, пока outputs не существуют.
- `not_assessed` - нормальный результат.
