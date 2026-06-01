# Runtime Fixture and Bigtop Reconstruction

Date: 2026-06-02
Branch: `codex/055-runtime-topology-evidence`

## Fixture Smoke

Command:

```bash
rm -rf /tmp/portolan-055-runtime-smoke
go run ./cmd/portolan map --selection internal/testfixtures/runtime-topology-evidence/selection.json --out /tmp/portolan-055-runtime-smoke --force
jq '.edges[] | select(.kind=="observes" or .kind=="depends-on")' /tmp/portolan-055-runtime-smoke/graph.json
jq '.edges[] | select(.kind=="unknown")' /tmp/portolan-055-runtime-smoke/graph.json
```

Result: verified.

Evidence:

- `api -> worker` emitted as `observes` with `runtime-visible` evidence from
  `runtime/redacted-export.json`.
- `fixture-deps:component:api -> fixture-deps:component:library` emitted as
  `depends-on` with `metadata-visible` evidence, not runtime-visible.
- `fixture-runtime -> fixture-runtime:unknown:runtime-topology` emitted as
  `unknown` because `coverage: partial` does not prove complete topology.

## Bigtop Runtime Source Reconstruction

Commands:

```bash
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}'
find /home/fall_out_bug/projects/bigtop-landscape -maxdepth 4 -type f \( -iname '*runtime*' -o -iname '*trace*' -o -iname '*otel*' -o -iname '*topology*' \) 2>/dev/null | sort | head -80
sed -n '1,220p' /home/fall_out_bug/projects/bigtop-landscape/selection.json
head -5 /home/fall_out_bug/projects/bigtop-landscape/.portolan/producer-runs.jsonl
```

Result: Bigtop runtime topology is not verified.

Evidence:

- Current running containers are `faust-staging-web-1`,
  `faust-staging-api-1`, `bvevvs-bot-dev`, `faust-staging-tika-1`, and
  `minikube`; no Bigtop runtime service is visible from `docker ps`.
- `/home/fall_out_bug/projects/bigtop-landscape/selection.json` has
  `"runtime": null`.
- The existing Bigtop producer-run ledger contains
  `producer-run-bigtop-runtime-not-assessed-20260601` with
  `producer_family: runtime-observation`, `status: not_assessed`, and
  `evidence_state: not_assessed`.
- Files found by runtime/trace/otel/topology name search are source files or
  dependencies, not a selected local runtime observation export.

## Disposition

- Runtime import fixture: verified.
- Static/runtime evidence separation: verified for the fixture map smoke.
- Bigtop runtime topology: blocked/not_assessed until a safe local runtime
  observation export is supplied.
- Starting Bigtop services, collecting live telemetry, or using credentials:
  not approved and not performed.
