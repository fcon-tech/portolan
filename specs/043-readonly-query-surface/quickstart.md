# Quickstart: Readonly Query Surface

```bash
go run ./cmd/portolan map --root . --out /tmp/portolan-query-smoke --force
go run ./cmd/portolan query findings --bundle /tmp/portolan-query-smoke --kind relationships --limit 5
go run ./cmd/portolan query gaps --bundle /tmp/portolan-query-smoke --limit 10
```

Expected result:

- output is JSON;
- records include evidence state and artifact reference;
- weak records include reasons;
- output is bounded and read-only.
- query output includes `portolan://` references.
- MCP remains a deferred contract; no daemon is started by the query command.
