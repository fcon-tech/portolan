# Cursor Stress Prompt: Runtime Capture Execution Boundary

You are reviewing Portolan evidence for Apache Bigtop runtime capture.

Use only the facts in this prompt. Classify each claim as one of:
`verified`, `partial`, `failed`, `cannot_verify`, or `not_assessed`.

Question:

What changed after this PR, and did Portolan prove it works?

Facts:

- The user explicitly approved a bounded runtime run with `разрешаю`.
- Approval timestamp: `2026-06-02T09:11:42+03:00`.
- Approved command:
  `./docker-hadoop.sh --docker-compose-plugin --create 1`.
- Cleanup command:
  `./docker-hadoop.sh --docker-compose-plugin --destroy`.
- Create command exit code: `0`.
- Destroy command exit code: `0`.
- Docker container observed after create:
  `20260602_091203_r32618-bigtop-1`.
- Docker network observed after create:
  `20260602_091203_r32618_default`.
- Docker image:
  `bigtop/puppet:trunk-ubuntu-24.04`.
- Provisioner roles attempted:
  `resourcemanager`, `nodemanager`, `mapred-app`, `hadoop-client`,
  `namenode`, `datanode`.
- `hadoop-yarn-nodemanager.service` was `active (running)`.
- A Java process for
  `org.apache.hadoop.yarn.server.nodemanager.NodeManager` was observed.
- `hadoop-hdfs-namenode.service` failed with status `1/FAILURE`.
- `hadoop-yarn-resourcemanager.service` briefly started, then failed with
  status `255/EXCEPTION`.
- `hadoop-mapreduce-historyserver.service` failed with status `1/FAILURE`.
- `hadoop-yarn-proxyserver.service` failed with status `1/FAILURE`.
- Datanode package/service/init HDFS steps were skipped because NameNode
  dependencies failed.
- `hadoop-hdfs-datanode.service` was not found during service status capture.
- Destroy removed the container, network, generated provisioner `config/`
  files, and `.provision_id`.
- Post-destroy residue checks for matching containers, networks, volumes, and
  target repository status were empty.
- This PR does not change Portolan code. It records a SpecKit evidence slice.
- Prior remaining gaps were full Bigtop runtime topology, full symbol/reference
  graph, call graph, and enterprise/human architecture parity.

Required answer:

1. State what this PR changes in product/evidence terms.
2. State whether Portolan is proven workable.
3. List verified claims.
4. List failed or partial runtime claims.
5. List claims that remain `cannot_verify`.
6. Provide allowed wording and disallowed wording.

Do not claim complete runtime topology or enterprise parity unless the facts
above support it.
