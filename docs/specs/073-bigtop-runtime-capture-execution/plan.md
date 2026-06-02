# Implementation Plan: Bigtop Runtime Capture Execution

**Branch**: `codex/073-bigtop-runtime-capture-execution`

**Spec**: `docs/specs/073-bigtop-runtime-capture-execution/spec.md`

## Summary

Execute the explicitly approved single-node Apache Bigtop Docker provisioner
runtime capture, record create/capture/destroy evidence, and keep the product
claim boundary honest: one container and one NodeManager runtime observation
were verified, but the Hadoop stack did not come up as a complete topology.

## Decision Gate

- **Simpler/Faster**: Stop at the preflight/execution-gate specs and keep
  runtime topology blocked. Rejected because the user explicitly approved the
  bounded create/capture/destroy run, and actual runtime-visible evidence is now
  required to close that gate.
- **Blocking Edge Cases**: The create command can exit `0` even while Puppet or
  systemd service startup fails. Docker state, service state, process state, and
  cleanup state must be assessed separately. Provisioner-created files and
  Docker resources must be destroyed and residue-checked.
- **Existing Open Source**: Use the upstream Apache Bigtop Docker provisioner
  already selected in specs 061, 062, and 065. No new runtime tool, scanner, or
  Portolan dependency is introduced.

## Scope

In scope:

- Approval artifact.
- Single-node Bigtop Docker provisioner create.
- Docker before/after create and after-destroy state capture.
- Container/network inspect.
- In-container systemd and process status capture.
- Destroy/cleanup evidence and residue checks.
- Cursor claim-boundary stress.
- Three assessed independent non-GPT review lanes.

Out of scope:

- Service repair or retries.
- Multi-node runtime capture.
- Portolan code changes.
- Runtime importer implementation.
- Full runtime topology or parity claims.

## Runtime Command

The runtime run is recorded externally at:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-073-runtime-capture-execution/tool-outputs/
```

Approved working directory:

```text
/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker
```

Approved create command:

```bash
./docker-hadoop.sh --docker-compose-plugin --create 1
```

Cleanup command:

```bash
./docker-hadoop.sh --docker-compose-plugin --destroy
```

## Runtime Results

verified:

- Approval timestamp: `2026-06-02T09:11:42+03:00`.
- Approval text: `разрешаю`.
- Create command exit code: `0`.
- Docker container created and running before cleanup:
  `20260602_091203_r32618-bigtop-1`.
- Docker network created before cleanup:
  `20260602_091203_r32618_default`.
- Docker image: `bigtop/puppet:trunk-ubuntu-24.04`.
- Provisioner roles attempted: `resourcemanager`, `nodemanager`,
  `mapred-app`, `hadoop-client`, `namenode`, and `datanode`.
- In-container process/service evidence showed YARN NodeManager active and
  running with Java process
  `org.apache.hadoop.yarn.server.nodemanager.NodeManager`.
- Destroy command exit code: `0`.
- Post-destroy residue checks found no matching container, network, volume, or
  target repository status residue.

failed:

- `hadoop-hdfs-namenode.service` failed with status `1/FAILURE`.
- `hadoop-yarn-resourcemanager.service` briefly started then failed with
  status `255/EXCEPTION`.
- `hadoop-mapreduce-historyserver.service` failed with status `1/FAILURE`.
- `hadoop-yarn-proxyserver.service` failed with status `1/FAILURE`.
- Datanode package/service/init HDFS steps were skipped because NameNode
  dependencies failed; `hadoop-hdfs-datanode.service` was not found during
  status capture.

partial:

- Runtime-visible evidence exists for Docker container/network creation and one
  running NodeManager component.
- The Bigtop runtime capture is not a healthy Hadoop topology because core HDFS,
  YARN ResourceManager, MapReduce HistoryServer, ProxyServer, and Datanode
  components did not reach running status.

cannot_verify:

- Complete Bigtop runtime topology.
- Runtime-backed service dependency graph.
- Human/enterprise architecture parity.
- Full symbol/reference graph.
- Call graph.

## Verification

```bash
# Run from the Portolan repo root.
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
