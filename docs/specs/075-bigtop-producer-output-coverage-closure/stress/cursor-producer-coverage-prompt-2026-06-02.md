# Cursor Stress Prompt: Producer Coverage Closure

You are reviewing Portolan's Bigtop producer-output coverage after specs
054-075.

Use only the facts in this prompt. Classify claims as `verified`, `partial`,
`failed`, `blocked`, `cannot_verify`, or `not_assessed`.

Producer coverage matrix facts:

- Protobuf API/catalog: `protoc` descriptor outputs are verified/partial for
  bounded Hadoop HDFS/common, Hadoop YARN API/common, HBase REST, and Alluxio
  proto surfaces. Successful spec 066 groups cover 76 descriptor files, 957
  messages, 61 enums, 38 services, and 325 methods. Whole-Hadoop and HBase
  shaded descriptors remain blocked/cannot_verify.
- Docker Compose deployment model: Docker Compose v5.1.4 `config` outputs are
  verified for the Bigtop Docker provisioner desired-state model: one service,
  one network, privileged mode, memory/mount metadata. It is not runtime
  topology.
- Helm deployment/catalog: Helm v3.19.4 outputs are verified/partial for
  Apache Airflow chart with 43 Kubernetes resources, 11 workloads, 8 Services,
  plus four Alluxio Helm chart templates from earlier specs. They are static
  desired-state outputs, not live Kubernetes runtime.
- Semgrep local API/catalog mentions: Semgrep 1.164.0 local rule pack scanned
  102 Bigtop provisioner/Puppet files and found 143 findings with 0 errors.
  This is mention/catalog evidence only.
- Universal Ctags Java/Go: 873,435 imported reference-role records across
  59,704 files under 15 selected Bigtop roots. It is source-visible package
  reference-role evidence, not resolved def/use or call graph.
- Universal Ctags C/C++/Python/Sh: 147,472 reference-role records across 8,432
  files. It is source-visible reference-role evidence, not resolved graph.
- `jdeps` existing artifacts: 289 package dependency rows over 9 existing
  `.jar`/`.class` artifacts, dominated by test/resource jars and tiny UDF
  fixtures; 16 unresolved `not found` rows. It is narrow compiled-artifact
  dependency evidence.
- jscpd: bounded Bigtop test/framework clone report JSON exists and validates.
  This is duplication/debt evidence, not topology.
- gopls: partial symbol listings for 5 selected Airflow Go SDK files; not a
  cross-reference graph.
- Runtime: spec 073 verified one Bigtop container, one network, Docker inspect,
  and one running YARN NodeManager. NameNode, ResourceManager, HistoryServer,
  ProxyServer failed; Datanode skipped/not found. Spec 074 health summary is
  blocked/not_assessed pending explicit approval.

Questions:

1. What producer-output claims beyond Syft/CycloneDX are now verified?
2. Which claims are only partial?
3. Which remain blocked or cannot_verify?
4. Does this matrix prove complete runtime topology?
5. Does this matrix prove full symbol/reference graph or call graph?
6. Does this matrix allow saying Cursor plus Portolan understands Bigtop like a
   human or enterprise code intelligence system?
7. Provide allowed and disallowed wording.

Do not overclaim from static model outputs, reference-role records, or partial
runtime evidence.
