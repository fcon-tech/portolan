# Установка Portolan Для Агента

Используй этот документ, когда пользователь говорит: "поставь Portolan",
"запусти Portolan на этом репозитории" или "подготовь Portolan artifacts".

## Что Нужно Получить От Пользователя

- Portolan git URL или путь к локальному checkout.
- Путь к локальной кодовой базе, которую надо прочитать.
- Опционально: путь к директории для Portolan bundle. По умолчанию агент должен
  использовать `<target-root>/.portolan/atlas`.

Не используй сеть, credentials, clone, mutation target-репозитория или daemon,
если пользователь явно этого не разрешил.

## 1. Поставь Agent Harness

Если пользователь хочет, чтобы coding-agent harness помнил Portolan для
проекта, сначала resolve `PORTOLAN` из URL или локального path. URL можно
fetch/clone только после явного разрешения скачать ровно этот URL.

Для captain-facing запуска сгенерируй copyable prompt из двух обязательных
входов:

```bash
scripts/portolan-captain-prompt.sh \
  --portolan <Portolan git URL or local checkout path> \
  --target-root <target-root>
```

Внутри run агент сам резолвит `PORTOLAN` в локальный `PORTOLAN_PATH` и спрашивает
разрешение перед URL fetch. Если `PORTOLAN` уже локальный checkout, используй
его напрямую и не клонируй повторно.

По умолчанию installer ставит полноценную первую команду атласа, чтобы
поддержанные agent instruction files получили связи, findings, query artifacts
и handoff для капитанского workflow. Используй `--scan-profile fast`, только
если оператор явно хочет легкий разведочный проход перед полной командой
атласа.

Можно поставить отдельно:

```bash
scripts/portolan-install.sh <target-root> --harness cursor
scripts/portolan-install.sh <target-root> --harness opencode
scripts/portolan-install.sh <target-root> --harness codex
scripts/portolan-install.sh <target-root> --harness claude
```

Installer пишет:

- Cursor: `<target-root>/.cursor/rules/portolan-atlas.mdc`
- OpenCode/Codex/Zed-compatible agents: managed Portolan block в `<target-root>/AGENTS.md`
- Claude: managed Portolan block в `<target-root>/CLAUDE.md`
- Command wrappers: `<target-root>/.portolan/bin/`
- Default bundle path: `<target-root>/.portolan/atlas`

## 2. Проверь, Спланируй И Построй Atlas Bundle

```bash
<target-root>/.portolan/bin/portolan-scan.sh --doctor <target-root> <target-root>/.portolan/atlas --skip-install --no-viewer
<target-root>/.portolan/bin/portolan-scan.sh --dry-run <target-root> <target-root>/.portolan/atlas --skip-install --no-viewer
<target-root>/.portolan/bin/portolan-scan.sh <target-root> <target-root>/.portolan/atlas --yes --skip-install --no-viewer
<target-root>/.portolan/bin/portolan-scan.sh --status <target-root> <target-root>/.portolan/atlas
```

Убирай `--skip-install` только после явного разрешения установить missing local
OSS tools. Missing producers остаются gaps.

Прямой scan shorthand используй только после `doctor` и `dry-run` или после
того, как их blockers явно записаны.

После scan всегда запускай `--status` через установленный wrapper. Не заменяй
его на `ls` или ручную проверку файлов: status JSON показывает fresh/reusable
compatibility и local-first flags.

Перед ответом прочитай:

- `receipt.json`
- `captain-atlas-scorecard.json`
- `captain-qna-eval.json` после запуска
  `<target-root>/.portolan/bin/portolan-query-eval.sh --run <bundle-dir>`
- `captain-handoff.md` и `captain-handoff.json` после запуска
  `<target-root>/.portolan/bin/portolan-captain-handoff.sh <bundle-dir>`
- `manifest.json`
- `atlas-facts.json`
- `repo-profiles.json`
- `atlas-surface-content.json`

Не загружай raw `relationships.jsonl`, `hotspots.jsonl`, `hotspots-full.jsonl`
или `gaps.jsonl` в чат для больших estate. Используй bounded
`portolan-bundle-query.sh`.

## 3. Query Перед Ответом

```bash
<target-root>/.portolan/bin/portolan-bundle-query.sh repos --bundle <bundle-dir> --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh relationships --bundle <bundle-dir> --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh hotspots --bundle <bundle-dir> --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh gaps --bundle <bundle-dir> --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh search --bundle <bundle-dir> --q "<term>" --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh source --bundle <bundle-dir> --repo <repo-id> --path <path> --line 1
<target-root>/.portolan/bin/portolan-bundle-query.sh selected-code --bundle <bundle-dir> --repo <repo-id> --path <path> --line 1 --limit 20
```

## 4. Открой Viewer Для Человека

```bash
<target-root>/.portolan/bin/portolan-viewer.sh
```

## 5. Проверь Installable Pack

Для проверки сгенерированных файлов и реальных Cursor/OpenCode CLI lanes:

```bash
scripts/portolan-product-acceptance.sh --require-agent-runtime
```

Product gate запускает static install smoke для Cursor/OpenCode/Codex/Claude
instruction files, реальные Cursor/OpenCode runtime lanes, local harness smoke,
schemas, Go checks, viewer build checks и diff whitespace. Убирай
`--require-agent-runtime` только когда недоступные CLI нужно записать как
`not_assessed`, а не считать ошибкой.

## 6. Legacy Go CLI

Используй только если оператор явно просит compatibility route для
`context prepare`, `map` или compatibility artifacts:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

## 7. OSS Producers

OSS-инструменты являются частью решения, когда они установлены локально и
пользователь разрешил их запуск. Portolan не переписывает mature scanners; он
запускает или импортирует их outputs и сохраняет evidence states.

Portolan не bundle'ит эти scanners. Перед запуском optional OSS tool проверь,
что upstream tool есть на `PATH`, через его обычный `--version` или `--help`.
Не устанавливай и не скачивай инструменты без явного разрешения пользователя.

## 8. Как Отвечать

В ответе обязательно разделяй:

- `verified`: проверено командой, тестом или прямым чтением артефакта.
- `failed`: проверка запускалась и упала.
- `blocked`: не удалось проверить из-за внешнего блокера.
- `not_assessed`: не запускалось или нет достаточных данных.
- `unknown` / `cannot_verify`: Portolan сохранил пробел или невозможность
  проверки.

Не делай claims шире локальных артефактов. Если Portolan видит 18 локальных
репозиториев, это не доказывает полную external ecosystem completeness.
