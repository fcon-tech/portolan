# Implementation Plan: Bigtop Runtime Topology Health Capture

**Branch**: `codex/074-bigtop-runtime-topology-health-capture`

**Spec**: `docs/specs/074-bigtop-runtime-topology-health-capture/spec.md`

## Summary

Run an explicitly approved, health-oriented Bigtop runtime capture that treats
component health and smoke probes as the topology proof, not the provisioner
script exit code. The slice either verifies a bounded single-node
HDFS/YARN/MapReduce runtime topology or records a verified runtime failure with
daemon logs and cleanup evidence.

## Decision Gate

- **Simpler/Faster**: Reuse PR #51 and stop at "partial runtime-visible
  evidence". Rejected because the user objective asks to drive runtime topology
  toward verified, and PR #51 explicitly left complete topology as
  `cannot_verify`.
- **Blocking Edge Cases**: The upstream provisioner can return exit `0` while
  core Hadoop services fail. Single-node Bigtop may be insufficient for some
  components. Runtime commands mutate Docker and provisioner files, so approval,
  cleanup, and residue checks are mandatory. Daemon logs may be absent or
  insufficient, in which case root cause remains `cannot_verify`.
- **Existing Open Source**: Continue using the upstream Apache Bigtop Docker
  provisioner selected in specs 061-073. Use standard Docker, systemd, Hadoop
  CLI, YARN CLI, and shell observation commands instead of adding a new runtime
  framework or Portolan-owned provisioner.

## Runtime Command Design

Approval-required candidate sequence:

```bash
./docker-hadoop.sh --docker-compose-plugin --create 1
./docker-hadoop.sh --docker-compose-plugin --exec 1 bash -lc '<read-only health commands>'
./docker-hadoop.sh --docker-compose-plugin --smoke-tests hdfs,yarn,mapreduce
./docker-hadoop.sh --docker-compose-plugin --destroy
```

The actual approved command sequence must be recorded before execution. If the
operator approves a narrower sequence, the ledger must reflect the narrower
scope and leave unrun checks as `not_assessed` or `cannot_verify`.

## Required Capture Artifacts

External output root pattern:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-074-runtime-topology-health-capture/tool-outputs/
```

Required artifacts:

- `approval.txt`
- `env-check.txt`
- `docker-ps-before.tsv`
- `docker-network-before.tsv`
- `docker-volume-before.tsv`
- `target-repo-status-before.txt`
- `create-output.txt`
- `create-exit-code.txt`
- `container-name.txt`
- `docker-ps-after-create.tsv`
- `docker-inspect-containers.json`
- `docker-inspect-networks.json`
- `systemd-services.txt`
- `processes.txt`
- `listening-ports.txt`
- `hadoop-daemon-logs.txt`
- `hdfs-smoke.txt`
- `yarn-smoke.txt`
- `mapreduce-smoke.txt`
- `smoke-tests-output.txt`
- `destroy-output.txt`
- `destroy-exit-code.txt`
- `post-destroy-container-residue.txt`
- `post-destroy-network-residue.txt`
- `post-destroy-volume-residue.txt`
- `target-repo-status-after-destroy.txt`
- `sha256.txt`

## Health Criteria

Topology can be `verified` only when all of these pass:

- Container is running during capture.
- NameNode service is active/running.
- Datanode service is active/running.
- ResourceManager service is active/running.
- NodeManager service is active/running.
- MapReduce HistoryServer service is active/running, or explicitly documented
  as not required for the bounded topology with a reviewed rationale.
- ProxyServer service is active/running, or explicitly documented as not
  required for the bounded topology with a reviewed rationale.
- HDFS CLI smoke can list root or report filesystem status successfully.
- YARN CLI smoke can report nodes or applications successfully.
- Cleanup is verified.

Any required service/probe failure prevents full runtime topology verification.

## Evidence Boundary

Allowed after this slice if supported:

- `verified`: bounded single-node Bigtop HDFS/YARN/MapReduce runtime topology
  with named passing service and smoke evidence.
- `failed`: bounded runtime topology attempted and failed with daemon-log
  evidence.
- `cannot_verify`: root cause or complete topology remains unverifiable because
  logs/probes are missing or the approved scope was narrower than required.

Not allowed unless future evidence appears:

- Multi-node runtime topology.
- Kubernetes runtime topology.
- Enterprise/human architecture parity.
- Full symbol/reference graph or call graph.

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
