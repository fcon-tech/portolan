# Quickstart: jscpd Sharded Duplication Plan

1. Prepare context for a multi-repo target.

```bash
go run ./cmd/portolan context prepare --root <target-root> --out <target-root>/.portolan/context --profile agent --force
```

2. Inspect the jscpd plan.

```bash
jq '.tools[] | select(.id == "jscpd")' <target-root>/.portolan/context/oss-plan.json
```

3. If approved, run one shard command at a time. Do not treat unrun or failed
shards as clone evidence.

4. Refresh context after producer output exists.

```bash
go run ./cmd/portolan context prepare --root <target-root> --out <target-root>/.portolan/context --profile agent --force
```

5. Duplication remains `not_assessed` until local jscpd JSON output is present
and inspected.
