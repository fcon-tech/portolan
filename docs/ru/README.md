# Portolan

[English version](../../README.md)

Portolan - локальный read-only набор для навигации по кодовым базам. Он
помогает AI-агентам и engineering leaders отвечать по проверяемым артефактам,
а не по уверенной прозе.

Portolan читает локальные репозитории и пишет bounded artifact bundle:

- context bundle для агента;
- map и graph;
- findings по relationships, duplication, configuration и technical debt;
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

Основной workflow создает context bundle для агента:

```bash
portolan context prepare --root <target-root> --out <output-dir>/context --profile cursor
```

Типичный output:

```text
<output-dir>/context/
  agent-brief.md
  answer-contract.md
  query-plan.md
  evidence-index.jsonl
  repos.json
  tool-registry.json
  oss-plan.json
  gaps.jsonl
```

Для более полного map:

```bash
portolan map --root <target-root> --out <output-dir>/map
```

Типичный output:

```text
<output-dir>/map/
  run.json
  coverage.json
  summary.json
  graph-index.json
  graph.json
  findings.jsonl
  map.md
```

Начинай с `summary.json`, `graph-index.json`, `findings.jsonl` и `map.md`.
Открывай большой `graph.json` только когда нужны детали.

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

После публикации тега `v0.1.0` установи первый public source-first release
через Go:

```bash
# Требуется опубликованный тег v0.1.0. Если команда падает, используй
# source-checkout route ниже, пока тег не доступен.
go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0
portolan --version
```

Эта команда получает исходники публичного Go module и собирает CLI локально.
Она не устанавливает prebuilt binary Portolan.

Пока тега нет, либо если нельзя или не нужно получать modules через
`go install`, склонируй source checkout и собери repo-local binary:

```bash
git clone https://github.com/fcon-tech/portolan.git
cd portolan
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan --help
.portolan/bin/portolan context prepare --root <target-root> --out <output-dir>/context --profile cursor
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

Начинай чтение с:

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
- Для OpenCode default-permission runs предпочитай repo-local output path под
  Portolan checkout, например `.portolan/runs/<target-name>`. Внешний output
  path в зафиксированном default-permission lane failed.
- `unknown`, `cannot_verify` и `not_assessed` нельзя превращать в успех.

## Инструкция Для Агента

Если нужно попросить агента установить и запустить Portolan, дай ему:

Это placeholders. Замени их на абсолютные локальные пути перед отправкой
агенту.

```text
PORTOLAN_PATH=<absolute path to Portolan checkout or binary>
TARGET_PATH=<absolute path to local target>
OUTPUT_PATH=<absolute path to empty output directory>
```

И скажи:

```text
Поставь и используй Portolan из PORTOLAN_PATH на TARGET_PATH. Запиши artifacts
в OUTPUT_PATH. Следуй docs/agent/INSTALL-PROMPT.ru.md, сохраняй unknown /
cannot_verify / not_assessed и цитируй локальные artifact paths для каждого
важного claim.
```

Полная русская инструкция: [docs/agent/INSTALL.ru.md](../agent/INSTALL.ru.md).
Готовый prompt для агента: [docs/agent/INSTALL-PROMPT.ru.md](../agent/INSTALL-PROMPT.ru.md).
Русская граница продукта: [docs/ru/product-boundary.md](product-boundary.md).

## OSS Как Часть Решения

Portolan не переписывает зрелые OSS-инструменты. Он может запускать локально
установленные producers и нормализовать их outputs:

```bash
portolan produce semgrep --root <target-root> --config <local-semgrep-config> --out <output-dir>/tool-outputs/semgrep.json
portolan produce repomix --root <target-root> --out <output-dir>/tool-outputs/repomix-output.xml
portolan produce graphify --root <target-root> --out <output-dir>/tool-outputs/graphify-run
```

Это локальные команды. Они не должны использовать сеть, credentials или daemon
без явного разрешения пользователя. OSS-инструменты здесь являются допустимыми
локальными зависимостями workflow, когда они установлены и явно нужны; их plans
не считаются evidence, пока нет сохраненного output.
Graphify запускается через read-only staging copy внутри output directory, так
что target checkout не должен мутироваться.

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

- Проверенное Cursor comparison относится к headless Cursor на одном фиксированном
  локальном Bigtop target, а не к UI Cursor/Composer вообще.
- Количество локальных репозиториев не доказывает complete inherited-estate
  coverage.
- Runtime service topology не assessed без supported local runtime observations;
  partial observations не доказывают complete topology.
- Security boundary narrow: есть documented untrusted-artifact boundary и
  focused tests для selected local CLI risks, но это не broad security
  certification.
- Exact duplicate source/config clusters поддержаны; near-clone detection
  требует локального jscpd-style evidence.
- Syft/CycloneDX, Semgrep, Repomix, Graphify, jscpd и symbol-index style
  outputs являются допустимыми локальными OSS-зависимостями workflow, когда
  они установлены и явно нужны. Graphify producer использует read-only staging
  copy. Их value и claims остаются evidence-specific.

Текущие безопасные claims и ограничения: [Product Claims](../product-claims.md).
