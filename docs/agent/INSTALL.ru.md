# Установка Portolan Для Агента

Используй этот документ, когда пользователь говорит: "поставь Portolan",
"запусти Portolan на этом репозитории" или "подготовь Portolan artifacts".

## Что Нужно Получить От Пользователя

- Путь к checkout Portolan или путь к уже установленному бинарю `portolan`.
- Путь к локальной кодовой базе, которую надо прочитать.
- Путь к пустой директории для выходных артефактов.

Не используй сеть, credentials, clone, mutation target-репозитория или daemon,
если пользователь явно этого не разрешил.

## 1. Найди Команду Portolan

Если `portolan` уже установлен:

```bash
portolan --version
```

Если пользователь дал checkout Portolan:

```bash
cd <portolan-checkout>
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

Дальше используй `.portolan/bin/portolan` из этого checkout.

Если agent harness ограничивает запись вне текущего checkout, для первого
запуска используй repo-local output directory, например `.portolan/runs/<name>`.
Переноси или передавай artifacts дальше только после успешного запуска.

`go run` допустим только как dev fallback из checkout Portolan:

```bash
go run ./cmd/portolan --version
```

## 2. Подготовь Контекст Для Агента

```bash
<portolan-cmd> context prepare --root <target-root> --out <output-dir>/context --profile cursor
```

Перед ответом прочитай:

- `<output-dir>/context/agent-brief.md`
- `<output-dir>/context/answer-contract.md`
- `<output-dir>/context/evidence-index.jsonl`
- `<output-dir>/context/gaps.jsonl`
- `<output-dir>/context/oss-plan.json`

## 3. Построй Map, Если Вопрос Широкий

```bash
<portolan-cmd> map --root <target-root> --out <output-dir>/map
```

Если в target есть локальный `selection.json`, сначала проверь его и используй
для map шага:

```bash
<portolan-cmd> selection validate --selection <target-root>/selection.json
<portolan-cmd> map --selection <target-root>/selection.json --out <output-dir>/map
```

Если selection не передан и файла нет, используй `map --root <target-root>`. Не
придумывай selection file за пользователя. Если validation падает, запиши эту
команду как `failed`, затем используй `map --root <target-root>`, если
пользователь не просил остановиться на invalid selection.

Сначала читай bounded artifacts:

- `<output-dir>/map/summary.json`
- `<output-dir>/map/graph-index.json`
- `<output-dir>/map/findings.jsonl`
- `<output-dir>/map/map.md`

Не загружай большой `graph.json` первым. Для drill-down используй:

```bash
<portolan-cmd> query findings --bundle <output-dir>/map --kind relationships --limit 20
<portolan-cmd> query gaps --bundle <output-dir>/map --limit 20
```

## 4. OSS Producers

OSS-инструменты являются частью решения, когда они установлены локально и
пользователь разрешил их запуск. Portolan не переписывает mature scanners; он
запускает или импортирует их outputs и сохраняет evidence states.

Portolan не bundle'ит эти scanners. Перед запуском optional producer проверь,
что upstream tool есть на `PATH`, через его обычный `--version` или `--help`.
Не устанавливай и не скачивай инструменты без явного разрешения пользователя.

Upstream entry points:

- Semgrep: <https://semgrep.dev/docs/getting-started/quickstart>
- Repomix: <https://github.com/yamadashy/repomix>
- Graphify: <https://github.com/safishamsi/graphify>
- Syft: <https://github.com/anchore/syft>
- jscpd: <https://jscpd.dev/>

Примеры:

```bash
<portolan-cmd> produce semgrep --root <target-root> --config <local-semgrep-config> --out <output-dir>/tool-outputs/semgrep.json
<portolan-cmd> produce repomix --root <target-root> --out <output-dir>/tool-outputs/repomix-output.xml
<portolan-cmd> produce graphify --root <target-root> --out <output-dir>/tool-outputs/graphify-run
```

Graphify запускается через staging-copy внутри `--out`, поэтому target checkout
остается read-only. Staging-copy не включает `.git`, `.portolan`, symlinks и
существующие `graphify-out` директории:

```bash
<portolan-cmd> import graphify --in <output-dir>/tool-outputs/graphify-run/source-copy/graphify-out/graph.json --root <target-root> --out <output-dir>/tool-outputs/graphify-portolan-graph.json
```

Не устанавливай Semgrep, Repomix, Graphify, Syft, jscpd, SCIP или Serena без
явного разрешения пользователя.

## 5. Как Отвечать

В ответе обязательно разделяй:

- `verified`: проверено командой, тестом или прямым чтением артефакта.
- `failed`: проверка запускалась и упала.
- `blocked`: не удалось проверить из-за внешнего блокера.
- `not_assessed`: не запускалось или нет достаточных данных.
- `unknown` / `cannot_verify`: Portolan сохранил пробел или невозможность
  проверки.

Не делай claims шире локальных артефактов. Если Portolan видит 18 локальных
репозиториев, это не доказывает полную external ecosystem completeness.
