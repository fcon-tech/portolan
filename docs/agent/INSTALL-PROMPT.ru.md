# Prompt Для Установки Portolan Агентом

Используй этот prompt, когда нужно сказать агенту "поставь Portolan" без
скрытых подсказок.

Скопируй агенту prompt block ниже. Если агент получает весь этот файл, а не
только block, он должен выполнить block после подстановки трех переменных, а не
спрашивать, что делать дальше.

Замени три переменные на абсолютные локальные пути:

```text
PORTOLAN_PATH=<absolute path to a Portolan checkout or installed portolan binary>
TARGET_PATH=<absolute path to the local codebase or landscape to inspect>
OUTPUT_PATH=<absolute path to an empty output directory>
```

Потом отправь агенту:

```text
Поставь и используй Portolan для локальной read-only навигации по кодовой базе.
Выполни эти шаги сейчас и отчитайся о результате. Не спрашивай, запускать ли
их. Спроси только если обязательный локальный путь отсутствует.

Inputs:
- PORTOLAN_PATH=<absolute path to a Portolan checkout or installed portolan binary>
- TARGET_PATH=<absolute path to the local target>
- OUTPUT_PATH=<absolute path to an empty output directory>

Правила:
- Используй только эти локальные пути.
- Не используй network access, credentials, clone, daemon или mutation target
  без моего явного разрешения.
- Если harness отклоняет запись в OUTPUT_PATH, один раз переключись на
  repo-local `.portolan/runs/<target-name>` внутри checkout Portolan и запиши
  исходную запись в OUTPUT_PATH как `failed`. Используй эту fallback
  директорию как OUTPUT_PATH для остальных шагов.
- Если PORTOLAN_PATH указывает на бинарь, проверь его через `--version`.
- Если PORTOLAN_PATH указывает на checkout Portolan, следуй
  `docs/agent/INSTALL.ru.md` и собери repo-local binary через
  `scripts/bootstrap-portolan`.
- Подготовь context в `OUTPUT_PATH/context`.
- Построй map в `OUTPUT_PATH/map`, если размер target разумный.
- Если существует `TARGET_PATH/selection.json`, проверь его и для map шага
  предпочти `map --selection TARGET_PATH/selection.json --out OUTPUT_PATH/map`.
  Иначе используй `map --root TARGET_PATH --out OUTPUT_PATH/map`.
- Если selection validation падает, запиши эту команду как `failed`, затем
  используй `map --root TARGET_PATH --out OUTPUT_PATH/map`.
- Читай bounded artifacts до большого `graph.json`:
  - `context/agent-brief.md`
  - `context/answer-contract.md`
  - `context/evidence-index.jsonl`
  - `context/gaps.jsonl`
  - `map/summary.json`
  - `map/graph-index.json`
  - `map/findings.jsonl`
  - `map/map.md`
- Сохраняй `verified`, `failed`, `blocked`, `not_assessed`, `unknown` и
  `cannot_verify`.
- Для каждого важного claim указывай локальный artifact path.
- Не заявляй complete estate coverage, runtime topology, ценность OSS scanner
  или architecture facts, если локальные Portolan artifacts этого не доказывают.

Ответь:
1. Какие команды запускались и какой статус у каждой: `verified`, `failed` или
   `blocked`.
2. Какие artifact paths созданы.
3. Какой локальный scope виден и какие completeness limits остаются.
4. Какие relationships, duplication, configuration surfaces и technical-debt
   candidates подтверждены evidence.
5. Какие поверхности остаются `unknown`, `cannot_verify` и `not_assessed`.
6. Три полезных следующих локальных действия.
7. Какие неподтвержденные claims ты избежал или случайно сделал.
```
