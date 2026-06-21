# Установка Portolan Для Агента

Используй этот документ, когда пользователь говорит: "поставь Portolan",
"запусти Portolan на этом репозитории" или "подготовь Portolan artifacts".

## Что Нужно Получить От Пользователя

- Путь к checkout Portolan или разрешение использовать source checkout.
- Путь к локальной кодовой базе, которую надо прочитать.
- Путь к директории для Portolan bundle.

Не используй сеть, credentials, clone, mutation target-репозитория или daemon,
если пользователь явно этого не разрешил.

## 1. Поставь Agent Harness

Если пользователь хочет, чтобы Cursor/OpenCode помнили Portolan для проекта,
установи инструкции в target:

```bash
git clone https://github.com/fcon-tech/portolan.git
cd portolan
scripts/portolan-install.sh <target-root> --harness all
```

Если checkout Portolan уже есть, не клонируй повторно: запусти install command
из существующего checkout.

По умолчанию installer ставит быстрый first core scan (`config,ctags`,
`--core-only`), чтобы Cursor/OpenCode получили queryable bundle до тяжелых
producers. Используй
`--scan-profile full`, только если оператор согласен на более тяжелую первую
команду.

Можно поставить отдельно:

```bash
scripts/portolan-install.sh <target-root> --harness cursor
scripts/portolan-install.sh <target-root> --harness opencode
```

Installer пишет:

- Cursor: `<target-root>/.cursor/rules/portolan-atlas.mdc`
- OpenCode: managed Portolan block в `<target-root>/AGENTS.md`
- Command wrappers: `<target-root>/.portolan/bin/`
- Default bundle path: `<target-root>/.portolan/atlas`

## 2. Построй Atlas Bundle

```bash
scripts/portolan-scan.sh <target-root> <target-root>/.portolan/atlas --yes --skip-install --no-viewer
```

Убирай `--skip-install` только после явного разрешения установить missing local
OSS tools. Missing producers остаются gaps.

Перед ответом прочитай:

- `manifest.json`
- `atlas-facts.json`
- `repo-profiles.json`
- `relationships.jsonl`
- `hotspots.jsonl`
- `hotspots-full.jsonl`
- `gaps.jsonl`
- `atlas-surface-content.json`

## 3. Query Перед Ответом

```bash
scripts/portolan-bundle-query.sh repos --bundle <bundle-dir> --limit 20
scripts/portolan-bundle-query.sh relationships --bundle <bundle-dir> --limit 20
scripts/portolan-bundle-query.sh hotspots --bundle <bundle-dir> --limit 20
scripts/portolan-bundle-query.sh gaps --bundle <bundle-dir> --limit 20
scripts/portolan-bundle-query.sh search --bundle <bundle-dir> --q "<term>" --limit 20
scripts/portolan-bundle-query.sh source --bundle <bundle-dir> --repo <repo-id> --path <path> --line 1
```

## 4. Открой Viewer Для Человека

```bash
cd <portolan-checkout>/viewer
node scripts/build-static.js
node scripts/serve.js --bundle <bundle-dir>
```

## 5. Проверь Installable Pack

Для проверки сгенерированных файлов и реальных Cursor/OpenCode CLI lanes:

```bash
scripts/portolan-product-acceptance.sh --require-agent-runtime
```

Product gate запускает static install smoke, реальные Cursor/OpenCode runtime
lanes, local harness smoke, schemas, Go checks, viewer build checks и diff
whitespace. Убирай `--require-agent-runtime` только когда недоступные CLI нужно
записать как `not_assessed`, а не считать ошибкой.

## 6. Legacy Go CLI

Используй только если оператор явно просит `context prepare`, `map` или старые
map artifacts:

```bash
go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0
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
