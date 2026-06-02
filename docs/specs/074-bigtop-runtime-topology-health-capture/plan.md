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

## Safety Bounds

Approval packet must include:

- Maximum wall-clock runtime: 20 minutes for create/provision plus 10 minutes
  for health/smoke capture, unless explicitly expanded.
- Container scope: one Bigtop Docker provisioner node.
- Memory scope: use the upstream config default `4g` container memory limit
  unless explicitly overridden.
- Network scope: Docker image/package acquisition allowed only through the
  upstream Bigtop provisioner path already selected in specs 061-073.
- Abort trigger: if create/provision hangs past the approved timeout, stop and
  run cleanup/destroy. Manual direct `docker rm -f` or `docker network rm`
  fallback requires separate approval unless the target resources are uniquely
  identified by the current `.provision_id`.
- Cleanup requirement: destroy plus residue checks must run after successful,
  failed, or timed-out capture attempts.

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
- `runtime-health-summary.json`
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

## Health Command Contract

The exact shell script may be adjusted before approval, but it must preserve
these checks:

```bash
systemctl --no-pager --plain status hadoop-hdfs-namenode hadoop-hdfs-datanode hadoop-yarn-resourcemanager hadoop-yarn-nodemanager hadoop-mapreduce-historyserver hadoop-yarn-proxyserver
systemctl --no-pager --plain list-units 'hadoop*' 'yarn*'
ps -eo user,pid,ppid,stat,etime,cmd | grep -E 'hadoop|yarn|mapreduce|hdfs|namenode|datanode|resourcemanager|nodemanager|historyserver|proxyserver' || true
ss -lntup || netstat -lntup || true
for d in /var/log/hadoop-hdfs /var/log/hadoop-yarn /var/log/hadoop-mapreduce /var/log/hadoop; do
  test -d "$d" && find "$d" -maxdepth 2 -type f -name '*.log' -print -exec tail -n 160 {} \;
done
hdfs dfsadmin -report
hdfs dfs -ls /
yarn node -list
yarn application -list
mapred job -list all || true
```

Expected assertions:

- Service commands must show active/running for every required service unless
  the ledger records a reviewed exception.
- HDFS commands must exit `0` to support HDFS topology verification.
- YARN commands must exit `0` and show at least the bounded node state to
  support YARN topology verification.
- MapReduce command failure is not automatically topology failure if
  HistoryServer is explicitly excluded, but it prevents MapReduce runtime claim
  promotion.
- Missing commands, missing log directories, or insufficient output must be
  recorded as `cannot_verify` for the affected claim.

## Runtime Health Summary Schema

`runtime-health-summary.json` must use this shape:

```json
{
  "schema_version": "portolan.runtime-health.v1",
  "producer_id": "bigtop-docker-provisioner-health-074",
  "target": "apache-bigtop single-node docker provisioner",
  "timestamp": "RFC3339",
  "approval_id": "string",
  "container": {
    "name": "string",
    "image": "string",
    "status": "running|exited|missing|unknown"
  },
  "services": {
    "hadoop-hdfs-namenode": {"state": "running|failed|missing|unknown", "evidence": "path"},
    "hadoop-hdfs-datanode": {"state": "running|failed|missing|unknown", "evidence": "path"},
    "hadoop-yarn-resourcemanager": {"state": "running|failed|missing|unknown", "evidence": "path"},
    "hadoop-yarn-nodemanager": {"state": "running|failed|missing|unknown", "evidence": "path"},
    "hadoop-mapreduce-historyserver": {"state": "running|failed|missing|unknown", "evidence": "path"},
    "hadoop-yarn-proxyserver": {"state": "running|failed|missing|unknown", "evidence": "path"}
  },
  "smoke": {
    "hdfs_report": {"state": "pass|fail|skipped|unknown", "evidence": "path"},
    "hdfs_ls_root": {"state": "pass|fail|skipped|unknown", "evidence": "path"},
    "yarn_node_list": {"state": "pass|fail|skipped|unknown", "evidence": "path"},
    "yarn_application_list": {"state": "pass|fail|skipped|unknown", "evidence": "path"},
    "mapreduce_job_list": {"state": "pass|fail|skipped|unknown", "evidence": "path"}
  },
  "classification": "verified|failed|cannot_verify",
  "limitations": ["string"],
  "artifacts_sha256": "path"
}
```

This is a producer-output ledger for spec 075 to consume. It is not a Portolan
importer contract until a later code slice adopts it.

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
