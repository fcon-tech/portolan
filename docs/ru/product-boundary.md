# Граница Продукта

Portolan - локальный read-only набор для навигации по кодовым базам. Его
первая задача - не оценить, хорошая система или плохая, а подготовить bounded
evidence artifacts, по которым агент или инженерный лидер может говорить о
видимом scope, relationships, duplication, configuration surfaces,
technical-debt candidates и пробелах.

Текущие безопасные формулировки и статусы claims живут в
[Product Claims](../product-claims.md). Если claim имеет статус `narrowed`, в
тексте нужно сохранять его границу.

## В Scope

- Локальное read-only чтение файлов.
- Single-repo и multi-repo inventory.
- Context bundle для агента.
- Map, graph, findings и human-readable packet.
- Relationship, duplication, configuration и technical-debt findings,
  подкрепленные локальным evidence.
- Import и normalization outputs локальных OSS-инструментов.
- Black-box представление через локальные metadata, runtime observations или
  explicit claims.
- Evidence states: `source-visible`, `metadata-visible`, `runtime-visible`,
  `claim-only`, `unknown`, `cannot_verify`, `not_assessed`.

## Вне Scope

- Coding harness.
- Readiness gate.
- Service catalog.
- Observability platform.
- Modernization platform.
- Автоматические rewrite recommendations.
- Merge, release, procurement или approval decisions.
- Hidden network calls.
- Always-on daemon collection.
- Credentials harvesting.
- Зависимость от Cursor, Claude, Codex, OpenCode, pi или любого одного agent
  harness.
- Замена Sourcegraph, CAST, Backstage, Port, Datadog, New Relic, Dynatrace,
  Moderne или других enterprise tools.
- Claim о complete inherited-estate coverage только по локальному количеству
  репозиториев.
- Claim о runtime service topology без локальных runtime observations.
- Claim о UI Cursor/Composer behavior на основе headless Cursor evidence.

## OSS Как Часть Решения

Portolan не должен переписывать mature scanners, если локальный OSS-инструмент
уже решает задачу достаточно хорошо. Правильная модель: запускать или
импортировать локальные outputs и нормализовать их в evidence graph.

Syft/CycloneDX, jscpd, Semgrep, Graphify, Repomix и symbol-index style exports
могут быть частью workflow, когда они установлены локально и явно разрешены.
Их outputs становятся evidence только после сохранения, нормализации и
фиксации evidence state. План запустить scanner не является evidence.

## Как Говорить Об Ограничениях

- `unknown` - нормальный результат, не ошибка.
- `cannot_verify` означает, что данные есть, но Portolan не может их проверить.
- `not_assessed` означает, что поверхность не запускалась или не была оценена.
- Локально видимый scope не доказывает полную внешнюю estate completeness.
- Частичные runtime observations не доказывают полную runtime topology.
- Helpful agent answer без локальных artifact paths остается prose, а не
  Portolan-backed evidence.
