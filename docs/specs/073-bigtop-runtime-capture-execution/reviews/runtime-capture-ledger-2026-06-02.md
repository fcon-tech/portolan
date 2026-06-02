# Runtime Capture Ledger

Spec: `docs/specs/073-bigtop-runtime-capture-execution/`

Date: 2026-06-02

External output root:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-073-runtime-capture-execution/tool-outputs/
```

## Approval

verified:

- Approval artifact: `approval.txt`.
- Approval timestamp: `2026-06-02T09:11:42+03:00`.
- Approval text: `разрешаю`.
- Approved scope: single-node Bigtop Docker provisioner runtime capture.
- Approved working directory:
  `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker`.
- Approved create command:
  `./docker-hadoop.sh --docker-compose-plugin --create 1`.
- Required cleanup command:
  `./docker-hadoop.sh --docker-compose-plugin --destroy`.

## Pre-Create Evidence

verified:

- Environment check artifact: `env-check.txt`.
- Docker version: `Docker version 29.5.2, build 747e901`.
- Docker Compose version: `Docker Compose version v5.1.4`.
- Ruby version: `ruby 4.0.5`.
- Baseline Docker state captured in `docker-ps-before.tsv`,
  `docker-network-before.tsv`, and `docker-volume-before.tsv`.

## Create Evidence

verified:

- Create transcript: `docker-create-output.txt`.
- Create exit code artifact: `docker-create-exit-code.txt`.
- Create exit code: `0`.
- Created/running container: `20260602_091203_r32618-bigtop-1`.
- Created network: `20260602_091203_r32618_default`.
- Image: `bigtop/puppet:trunk-ubuntu-24.04`.
- Docker inspect artifacts: `docker-inspect-containers.json` and
  `docker-inspect-networks.json`.
- Docker list after create: `docker-hadoop-list-after-create.txt`.
- Provisioner roles attempted: `resourcemanager`, `nodemanager`,
  `mapred-app`, `hadoop-client`, `namenode`, and `datanode`.

## Runtime Component Evidence

verified:

- `hadoop-yarn-nodemanager.service` was `active (running)`.
- Process table contained Java process
  `org.apache.hadoop.yarn.server.nodemanager.NodeManager`.

failed:

- `hadoop-hdfs-namenode.service` failed with status `1/FAILURE`.
- `hadoop-yarn-resourcemanager.service` failed with status `255/EXCEPTION`
  after briefly starting.
- `hadoop-mapreduce-historyserver.service` failed with status `1/FAILURE`.
- `hadoop-yarn-proxyserver.service` failed with status `1/FAILURE`.
- Datanode setup and HDFS initialization were skipped because NameNode
  dependencies failed.
- `hadoop-hdfs-datanode.service` was not found during service status capture.

partial:

- Runtime-visible evidence exists for container/network creation and one
  running NodeManager component.
- Runtime-visible evidence does not show a complete or healthy Bigtop Hadoop
  topology.

cannot_verify:

- Complete runtime topology.
- Runtime-backed topology graph across HDFS/YARN/MapReduce.
- Runtime service dependency correctness.
- Human/enterprise architecture parity.

## Cleanup Evidence

verified:

- Destroy transcript: `destroy-output.txt`.
- Destroy exit code artifact: `destroy-exit-code.txt`.
- Destroy exit code: `0`.
- Destroy stopped and removed container
  `20260602_091203_r32618-bigtop-1`.
- Destroy removed network `20260602_091203_r32618_default`.
- Destroy removed provisioner-generated `config/` files and `.provision_id`.
- Post-destroy residue artifacts:
  `post-destroy-container-residue.txt`,
  `post-destroy-network-residue.txt`,
  `post-destroy-volume-residue.txt`, and
  `target-repo-status-after-destroy.txt`.
- Post-destroy residue files are empty.
- Target Bigtop repository status after destroy is clean.

## Evidence Boundary

verified:

- Portolan can preserve and communicate runtime-visible evidence when an
  approved external runtime capture produces inspectable Docker and process
  state.

not verified:

- Portolan has not proven complete Bigtop runtime topology.
- Portolan has not proven runtime/service recovery or operational readiness.
- Portolan has not proven enterprise code-intelligence parity.

Risk:

- Treating create exit `0` as topology success would be a false positive.
