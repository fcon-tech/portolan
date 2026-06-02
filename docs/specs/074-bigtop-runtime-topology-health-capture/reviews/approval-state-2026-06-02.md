# Approval State

Spec: `docs/specs/074-bigtop-runtime-topology-health-capture/`

Date: 2026-06-02

## Runtime Command Approval

blocked:

- No fresh explicit approval has been recorded for the spec 074 runtime command
  sequence.
- The previous approval text `разрешаю` was recorded for spec 073's bounded
  single-node create/capture/destroy run.
- Spec 074 proposes an extended command sequence with `--exec` health probes
  and `--smoke-tests hdfs,yarn,mapreduce`; this is materially broader than the
  spec 073 capture.

## Approval Required Before Runtime Execution

The next approval should explicitly name or accept this bounded sequence:

```bash
./docker-hadoop.sh --docker-compose-plugin --create 1
./docker-hadoop.sh --docker-compose-plugin --exec 1 bash -lc '<read-only health commands>'
./docker-hadoop.sh --docker-compose-plugin --smoke-tests hdfs,yarn,mapreduce
./docker-hadoop.sh --docker-compose-plugin --destroy
```

It should also accept:

- Docker container/network mutation.
- Execution of read-only observation commands inside the Bigtop container.
- Bigtop smoke tests for HDFS, YARN, and MapReduce.
- Required cleanup/destroy and residue checks.

## Current Execution State

not_assessed:

- No spec 074 runtime command has been executed.
- No spec 074 service-health, daemon-log, smoke-probe, or cleanup evidence
  exists yet.

cannot_verify:

- Bounded runtime topology remains `cannot_verify` until an approved spec 074
  run produces service-health and smoke-probe evidence.
