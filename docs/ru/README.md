# Portolan

[English version](../../README.md)

Portolan - локальный read-only набор для навигации по кодовым базам. Он
помогает AI-агентам и engineering leaders отвечать по проверяемым артефактам,
а не по уверенной прозе.

Portolan читает локальные репозитории и пишет atlas bundle:

- список видимых repos/components;
- relationships, duplication, configuration surfaces и technical-debt
  candidates;
- search/source/symbol indexes для drill-down;
- viewer для человека;
- явные `unknown`, `cannot_verify` и `not_assessed`;
- импортированные outputs локальных OSS-инструментов.

## Когда Использовать

Используй Portolan, когда нужно ответить на вопросы:

- Что видно в этом repo или локальном software landscape?
- Какие dependencies и relationships подтверждаются локальным evidence?
- Где есть duplicate source/config files?
- Какие env vars, ports, manifests, workflows, feature flags или secret
  references видны?
- Какие technical-debt candidates подкреплены локальным evidence?
- Что остается unknown, missing или not assessed?

Portolan особенно полезен для messy, legacy, multi-repo и partly black-box
систем.

## Что Получится

Основной workflow устанавливает инструкции для Cursor/OpenCode, строит
atlas bundle и открывает local viewer. Агент сначала строит bundle, затем
отвечает через bounded `portolan-bundle-query`, а не грузит весь target в чат.

Типичный bundle:

```text
<target-root>/.portolan/atlas/
  manifest.json
  atlas-facts.json
  repo-profiles.json
  relationships.jsonl
  hotspots.jsonl
  hotspots-full.jsonl
  gaps.jsonl
  search-index.jsonl
  symbol-index.jsonl
```

## Чем Portolan Не Является

Portolan не является:

- coding harness;
- readiness gate;
- service catalog;
- observability platform;
- modernization platform;
- заменой Cursor, Claude, Sourcegraph, Backstage или enterprise code
  intelligence.

## Быстрый Старт

Основной путь сейчас — source checkout Portolan плюс installable harness для
Cursor/OpenCode:

```bash
git clone https://github.com/fcon-tech/portolan.git
cd portolan
scripts/portolan-install.sh <target-root> --harness all
```

Installer пишет:

- `<target-root>/.cursor/rules/portolan-atlas.mdc` для Cursor Project Rules;
- managed Portolan block в `<target-root>/AGENTS.md` для OpenCode;
- target-local command wrappers в `<target-root>/.portolan/bin/`;
- default bundle path: `<target-root>/.portolan/atlas`.

По умолчанию harness ставит быстрый first core scan (`config,ctags`,
`--core-only`), чтобы Cursor/OpenCode получили queryable bundle до тяжелых
producers. Если оператор явно согласен на тяжелую первую команду, используй
`--scan-profile full`.

Собрать atlas bundle вручную:

```bash
scripts/portolan-scan.sh <target-root> <bundle-dir> --yes --skip-install --no-viewer
```

Убирай `--skip-install` только после явного разрешения установить missing local
OSS tools. Viewer открывай отдельно:

```bash
<target-root>/.portolan/bin/portolan-viewer.sh
```

Проверить installable Cursor/OpenCode pack на текущей машине:

```bash
scripts/portolan-product-acceptance.sh --require-agent-runtime
```

Если Cursor/OpenCode CLI недоступны и это не должно ломать локальную проверку,
запусти product acceptance без `--require-agent-runtime`; недоступные lanes
будут `not_assessed`.

## Legacy Go CLI

Используй этот путь только для старых `context prepare` / `map` workflows.
После публикации тега `v0.1.0` legacy CLI можно собрать через Go:

```bash
# Требуется опубликованный тег v0.1.0. Если команда падает, используй
# source-checkout route ниже, пока тег не доступен.
go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0
portolan --version
```

Пока тега нет, либо если нельзя или не нужно получать modules через
`go install`, склонируй source checkout и собери repo-local binary:

```bash
git clone https://github.com/fcon-tech/portolan.git
cd portolan
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan --help
.portolan/bin/portolan context prepare --root <target-root> --out <output-dir>/context --profile agent
.portolan/bin/portolan map --root <target-root> --out <output-dir>/map
```

Portolan пока не публикует downloadable prebuilt binaries. Для source bootstrap
нужна версия Go, указанная в `go.mod`.
Если bootstrap падает из-за отсутствующего Go или cached modules, смотри
[Troubleshooting](../agent/TROUBLESHOOTING.md). Разрешай network dependency
download только явно:

```bash
PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1 scripts/bootstrap-portolan
```

В legacy map/context runs начинай чтение с:

```text
<output-dir>/context/agent-brief.md
<output-dir>/context/answer-contract.md
<output-dir>/context/evidence-index.jsonl
<output-dir>/context/gaps.jsonl
<output-dir>/map/summary.json
<output-dir>/map/graph-index.json
<output-dir>/map/findings.jsonl
<output-dir>/map/map.md
```

## Навигация По Документации

Если непонятно, какой документ открыть первым, начни с
[Documentation Onboarding](../onboarding.md). Там есть маршрут для human
overview, agent run, install/build, Cursor, OpenCode и release notes.
Сейчас этот маршрут ведется на английском; русские agent prompts остаются в
`../agent/`.

Важные границы:

- Cursor evidence сейчас относится к headless Cursor Agent CLI / Composer, а
  не к Cursor UI вообще.
- Для OpenCode default-permission runs предпочитай output path внутри target,
  например `<target-root>/.portolan/atlas`. Внешний output path в
  зафиксированном default-permission lane failed.
- `unknown`, `cannot_verify` и `not_assessed` нельзя превращать в успех.

## Инструкция Для Агента

Если нужно попросить агента установить и запустить Portolan, дай ему:

Это шаблонные значения. Замени их на абсолютные локальные пути перед отправкой
агенту.

```text
PORTOLAN_PATH=<absolute path to Portolan checkout>
TARGET_ROOT=<absolute path to local target>
BUNDLE_DIR=<absolute path to atlas bundle directory>
```

И скажи:

```text
Поставь и используй Portolan из PORTOLAN_PATH на TARGET_ROOT. Запиши artifacts
в BUNDLE_DIR. Следуй docs/agent/INSTALL-PROMPT.ru.md, сохраняй unknown /
cannot_verify / not_assessed и цитируй локальные artifact paths для каждого
важного claim.
```

Полная русская инструкция: [docs/agent/INSTALL.ru.md](../agent/INSTALL.ru.md).
Готовый prompt для агента: [docs/agent/INSTALL-PROMPT.ru.md](../agent/INSTALL-PROMPT.ru.md).
Русская граница продукта: [docs/ru/product-boundary.md](product-boundary.md).

## OSS Как Часть Решения

Portolan не переписывает зрелые OSS-инструменты и не добавляет свои обертки
над mature scanners. Агент запускает нативный CLI/skill/MCP нужного OSS
инструмента, сохраняет output локально, а Portolan импортирует и нормализует
этот output:

```bash
semgrep --config <local-semgrep-config> --json --output <output-dir>/tool-outputs/semgrep.json <target-root>
repomix <target-root> --output <output-dir>/tool-outputs/repomix-output.xml --style xml
# Graphify output should be produced by native Graphify CLI/skill/MCP, then imported when needed.
```

Это локальные команды. Они не должны использовать сеть, credentials или daemon
без явного разрешения пользователя. OSS-инструменты здесь являются допустимыми
локальными зависимостями workflow, когда они установлены и явно нужны; recipes
не считаются evidence, пока нет сохраненного output.

## Evidence States

Используй эти состояния как контракт:

- `source-visible`: видно в source files.
- `metadata-visible`: видно в локальных manifests, metadata или tool outputs.
- `runtime-visible`: видно в supplied local runtime observations.
- `claim-only`: заявлено, но не проверено локально.
- `unknown`: данных нет.
- `cannot_verify`: данные есть, но Portolan не может их проверить.

Reports могут также использовать `not_assessed`, когда поверхность не
запускалась или detector не реализован.

## Текущие Ограничения

Текущие безопасные claims живут в [Product Claims](../product-claims.md).

Главные ограничения:

- Именованные acceptance examples являются target-specific evidence, а не
  основной продуктовой историей. Проверенное Cursor comparison относится к
  headless Cursor на именованном локальном target, а не к UI Cursor/Composer
  вообще.
- Количество локальных репозиториев не доказывает complete inherited-estate
  coverage.
- Runtime service topology не assessed без supported local runtime observations;
  partial observations не доказывают complete topology.
- Security boundary narrow: есть documented untrusted-artifact boundary и
  focused tests для selected local CLI risks, но это не broad security
  certification.
- Duplication findings требуют локального jscpd/CPD-style evidence. Без
  выбранного tool output это `not_assessed`, а не встроенный detector.
- Syft/CycloneDX, Semgrep, Repomix, Graphify, jscpd и symbol-index style
  outputs являются допустимыми локальными OSS-зависимостями workflow, когда
  они установлены и явно нужны. Их value и claims остаются evidence-specific;
  они не доказывают broad scanner coverage или certification.

Текущие безопасные claims и ограничения: [Product Claims](../product-claims.md).
