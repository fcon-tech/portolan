You are evaluating Apache Bigtop architecture from the source snippets below only.
This is the Cursor-only bounded baseline: do not use Portolan artifacts, producer-run ledgers, generated maps, or prior stress outputs.

Preserve uncertainty. Do not claim runtime topology unless the provided snippets contain runtime-visible observations. Static Docker Compose, Helm values, proto definitions, and README text are not runtime topology.

Required output: markdown table with columns `question_id`, `answer`, `evidence`, `claim_status`, `remaining_gap`.

Question set:
# Bigtop Architecture Question Set

Date: 2026-06-02

## Scoring Rules

- `verified`: answer is correct for the scoped question and cites sufficient
  local evidence from required families.
- `partial`: answer is useful but narrower than the question or missing one
  required evidence family.
- `failed`: answer is wrong, overclaims, or cites unsupported evidence.
- `blocked`: required evidence cannot be safely produced in this slice.
- `not_assessed`: answer or evidence is missing.

Runtime topology cannot score `verified` without Bigtop `runtime-visible`
evidence. Deployment manifests, API descriptors, dependency inventories, source
files, and producer-run metadata are not runtime topology.

## Questions

| ID | Question | Required evidence for `verified` | Disallowed shortcuts | Expected weak boundary |
| --- | --- | --- | --- | --- |
| Q1 | What is the role of the Apache Bigtop repository within the selected Bigtop landscape? | source/inventory plus manifest/corpus evidence | Treating selected repos as complete ecosystem without corpus evidence | Completeness outside the corpus remains unknown |
| Q2 | Which selected repositories appear to be deployment or packaging surfaces, and what evidence supports that? | source/inventory plus deployment/model producer output | Inferring live runtime from Docker Compose or Helm templates | Deployment/model may verify declared packaging only |
| Q3 | What service or component relationships can be stated from the Bigtop Docker Compose output? | deployment/model producer-run and local output | Calling declared Compose services runtime topology | Runtime remains not_assessed |
| Q4 | What Kubernetes model evidence exists for Alluxio monitor, and what does it not prove? | Helm producer-run and local rendered manifest | Generalizing Alluxio monitor chart to all Bigtop Kubernetes architecture | Scope remains bounded to the chart |
| Q5 | What API/catalog evidence exists for Alluxio gRPC, and what architecture claim can it support? | protobuf descriptor producer-run and local output | Treating bounded descriptors as full API catalog or runtime call graph | Full Bigtop API catalog remains partial/not_assessed |
| Q6 | Does Portolan currently prove Bigtop runtime topology? | runtime-visible Bigtop observation evidence | Static dependency, deployment, source, or API evidence | Expected answer: blocked/not_assessed |
| Q7 | Does Portolan currently prove symbol/reference relationships across Bigtop? | symbol/reference producer output | Dependency/SBOM or file inventory | Expected answer: not_assessed |
| Q8 | Does Cursor plus Portolan give better evidence discipline than Cursor alone for architecture answers? | paired Cursor-only and Cursor-plus-Portolan outputs plus scoring ledger | Single-lane subjective impression | Improvement may be partial, failed, or not_assessed |
| Q9 | Which architecture claims are safe to make publicly after specs 054 and 055? | acceptance ledger plus product claim boundary | "Understands Bigtop like enterprise code intelligence" as broad claim | Only scoped claims may be verified |

Source snippets:

## Bigtop selected repository ids from selection.json
alluxio,apache-airflow apache-bigtop-repo,apache-flink apache-hadoop,apache-hbase apache-hive,apache-kafka apache-phoenix,apache-ranger apache-solr,apache-spark apache-tez,apache-zeppelin apache-zookeeper

## apache-bigtop-repo README excerpt
==========================================

...is a project for the development of packaging and tests of the [Apache Hadoop](http://hadoop.apache.org/) ecosystem.

The primary goal of Apache Bigtop is to build a community around the packaging and interoperability testing of Apache Hadoop-related projects. This includes testing at various levels (packaging, platform, runtime, upgrade, etc...) developed by a community with a focus on the system as a whole, rather than individual projects.

Immediately Get Started with Deployment and Smoke Testing of BigTop
===================================================================

The simplest way to get a feel for how bigtop works, is to just cd into `provisioner` and try out the docker recipes. It rapidly spins up, and runs the bigtop smoke tests on, a local bigtop based big data distribution. Once you get the gist, you can hack around with the recipes to learn how the puppet/rpm/smoke-tests all work together, going deeper into the components you are interested in as described below.

Quick overview of source code directories
=========================================

* __bigtop-deploy__ : deployment scripts and puppet stuff for Apache Bigtop.
* __bigtop-packages__ : RPM/DEB specifications for Apache Bigtop subcomponents.
* __bigtop-test-framework__ : The source code for the iTest utilities (framework used by smoke tests).
* __bigtop-tests__ :
* __test-artifacts__ : source for tests.
* __test-execution__ : maven pom drivers for running the integration tests found in test-artifacts.
* __bigtop-toolchain__ : puppet scripts for setting up an instance which can build Apache Bigtop, sets up utils like jdk/maven/protobufs/...
* __provisioner__ : Docker Provisioner that automatically spin up Hadoop environment with one click.
* __docker__ : Dockerfiles and Docker Sandbox build scripts.

Also, there is a new project underway, Apache Bigtop blueprints, which aims to create templates/examples that demonstrate/compare various Apache Hadoop ecosystem components with one another.

Contributing
============

There are lots of ways to contribute.  People with different expertise can help with various subprojects:

* __puppet__ : Much of the Apache Bigtop deploy and packaging tools use puppet to bootstrap and set up a cluster. But recipes for other tools are also welcome (ie. Chef, Ansible, etc.)
* __groovy__ : Primary language used to write the Apache Bigtop smokes and itest framework.
* __maven__ : Used to build Apache Bigtop smokes and also to define the high level Apache Bigtop project.
* __RPM/DEB__ : Used to package Apache Hadoop ecosystem related projects into GNU/Linux installable packages for most popular GNU/Linux distributions. So one could add a new project or improve existing packages.
* __hadoop__ : Apache Hadoop users can also contribute by using the Apache Bigtop smokes, improving them, and evaluating their breadth.
* __contributing your workloads__ : Contributing your workloads enable us to tests projects against real use cases and enable you to have people verifying the use cases you care about are always working.
* __documentation__ : We are always in need of a better documentation!
* __giving feedback__ : Tell us how you use Apache Bigtop, what was great and what was not so great. Also, what are you expecting from it and what would you like to see in the future?

Also, opening [JIRA's](https://issues.apache.org/jira/browse/BIGTOP) and getting started by posting on the mailing list is helpful.

What do people use Apache Bigtop for?
==============================

You can go to the [Apache Bigtop website](http://bigtop.apache.org/) for notes on how to do "common" tasks like:

  * Apache Hadoop App developers: Download an Apache Bigtop built Apache Hadoop 2.0 VM from the website, so you can have a running psuedodistributed Apache Hadoop cluster to test your code on.
  * Cluster administers or deployment gurus: Run the Apache Bigtop smoke tests to ensure that your cluster is working.
  * Vendors: Build your own Apache Hadoop distribution, customized from Apache Bigtop bits.

Getting Started
===============

Below are some recipes for getting started with using Apache Bigtop. As Apache Bigtop has different subprojects, these recipes will continue to evolve.
For specific questions it's always a good idea to ping the mailing list at dev-subscribe@bigtop.apache.org to get some immediate feedback, or [open a JIRA](https://issues.apache.org/jira/browse/BIGTOP).

For Users: Running the smoke tests
-----------------------------------

The simplest way to test bigtop is described in bigtop-tests/smoke-tests/README file

For integration (API level) testing with maven, read on.

For Users: Running the integration tests
-----------------------------------------

WARNING: since testing packages requires installing them on a live system it is highly recommended to use VMs for that. Testing Apache Bigtop is done using iTest framework. The tests are organized in maven submodules, with one submodule per Apache Bigtop component.  The bigtop-tests/test-execution/smokes/pom.xml defines all submodules to be tested, and each submodule is in its own directory under smokes/, for example:

*smokes/hadoop/pom.xml*
*smokes/hive/pom.xml*
*... and so on.*

* New way (with Gradle build in place)
  * Step 1: install smoke tests for one or more components
    * Example 1:

## apache-bigtop-repo provisioner/docker/docker-compose.yml
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

services:
    bigtop:
        image: ${DOCKER_IMAGE}
        command: /sbin/init
        domainname: bigtop.apache.org
        privileged: true
        mem_limit: ${MEM_LIMIT}
        volumes:
        - ../../:/bigtop-home
        - ./config/hiera.yaml:/etc/puppet/hiera.yaml
        - ./config/hieradata:/etc/puppet/hieradata
        - ./config/hosts:/etc/hosts
        - /sys/fs/cgroup:/sys/fs/cgroup:ro

## alluxio monitor Helm Chart.yaml and values excerpt
#
# The Alluxio Open Foundation licenses this work under the Apache License, version 2.0
# (the "License"). You may not use this work except in compliance with the License, which is
# available at www.apache.org/licenses/LICENSE-2.0
#
# This software is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied, as more fully set forth in the License.
#
# See the NOTICE file distributed with this work for information regarding copyright ownership.
#

name: monitor
apiVersion: v1
description: Use prometheus and grafana to monitor alluxio cluster.
version: 0.1.0

#
# The Alluxio Open Foundation licenses this work under the Apache License, version 2.0
# (the "License"). You may not use this work except in compliance with the License, which is
# available at www.apache.org/licenses/LICENSE-2.0
#
# This software is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied, as more fully set forth in the License.
#
# See the NOTICE file distributed with this work for information regarding copyright ownership.
#

# The fullnameOverride should not be modified in the usual case.
fullnameOverride: alluxio-monitor
imagePullPolicy: IfNotPresent

# The grafana plugin path config, include datasource path and dashboards path.
grafanaConfig:
- name: grafana-dashboard-config
  path: /etc/grafana/provisioning/dashboards
- name: grafana-datasource-config
  path: /etc/grafana/provisioning/datasources

# The prometheus.yaml file path.
prometheusConfig:
  - name: prometheus-config
    path: /etc/prometheus

## prometheus ##

prometheus:
  enabled: true
  imageInfo:
    image: prom/prometheus
    imageTag: latest
  port:
    TCP: 9090
  args:
    - "--config.file=/etc/prometheus/prometheus.yaml" # the prometheus config file path
    - "--storage.tsdb.path=/prometheus" # Where prometheus writes its database.
    - "--storage.tsdb.retention=72h" # When to remove old data
    - "--web.listen-address=:9090" # Listen address
  hostPID: false
  hostNetwork: false
  # dnsPolicy will be ClusterFirstWithHostNet if hostNetwork: true
  # and ClusterFirst if hostNetwork: false
  # You can specify dnsPolicy here to override this inference
  # dnsPolicy: ClusterFirst
  resources:
    limits:
      cpu: "4"
      memory: "4G"
    requests:
      cpu: "1"
      memory: "1G"

## grafana ##

grafana:
  env:
    GF_AUTH_BASIC_ENABLED: "true" # Enable authentication
    GF_AUTH_ANONYMOUS_ENABLED: "false"
  imageInfo:
    image: grafana/grafana
    imageTag: latest
  # Use nodeIp:hostPort visit the grafana web
  port:
    web: 3000
    hostPort: 8080
  hostPID: false
  hostNetwork: false
  # dnsPolicy will be ClusterFirstWithHostNet if hostNetwork: true
  # and ClusterFirst if hostNetwork: false
  # You can specify dnsPolicy here to override this inference
  # dnsPolicy: ClusterFirst
  resources:
    limits:
      cpu: "2"
      memory: "2G"
    requests:
      cpu: "0.5"
      memory: "1G"


## alluxio gRPC proto excerpt
syntax = "proto2";

option java_multiple_files = true;
option java_package = "alluxio.grpc";
option java_outer_classname = "BlockMasterProto";

package alluxio.grpc.block;

import "grpc/common.proto";

enum BlockMasterInfoField {
  CAPACITY_BYTES = 1;
  CAPACITY_BYTES_ON_TIERS = 2;
  FREE_BYTES = 3;
  LIVE_WORKER_NUM = 4;
  LOST_WORKER_NUM = 5;
  USED_BYTES = 6;
  USED_BYTES_ON_TIERS = 7;
  DECOMMISSIONED_WORKER_NUM = 8;
}

message BlockMasterInfo {
  optional int64 capacityBytes = 1;
  map<string, int64> capacityBytesOnTiers = 2;
  optional int64 freeBytes = 3;
  optional int32 liveWorkerNum = 4;
  optional int32 lostWorkerNum = 5;
  optional int64 usedBytes = 6;
  map<string, int64> usedBytesOnTiers = 7;
  optional int32 decommissionedWorkerNum = 8;
}

message GetBlockInfoPOptions {}
message GetBlockInfoPRequest {
  /** the id of the block */
  optional int64 blockId = 1;

  optional GetBlockInfoPOptions options = 2;
}
message GetBlockInfoPResponse {
  optional grpc.BlockInfo blockInfo = 1;
}

message GetCapacityBytesPOptions {}
message GetCapacityBytesPResponse {
  optional int64 bytes = 1;
}

message GetBlockMasterInfoPOptions {
 repeated BlockMasterInfoField filters = 1;
}
message GetBlockMasterInfoPResponse {
 optional BlockMasterInfo blockMasterInfo = 1;
}

message GetUsedBytesPOptions {}
message GetUsedBytesPResponse {
  optional int64 bytes = 1;
}

message WorkerInfo {
  optional int64 id = 1;
  optional grpc.WorkerNetAddress address = 2;
  optional int32 lastContactSec = 3;
  optional string state = 4;
  optional int64 capacityBytes = 5;
  optional int64 usedBytes = 6;
  optional int64 startTimeMs = 7;
  map<string, int64> capacityBytesOnTiers = 8;
  map<string, int64> usedBytesOnTiers = 9;
  optional BuildVersion buildVersion = 10;
  optional int32 numVCpu = 11;
}

enum WorkerRange {
  ALL = 1;
  LIVE = 2;
  LOST = 3;
  SPECIFIED = 4;
  DECOMMISSIONED = 5;
}

enum WorkerInfoField {
  ADDRESS = 1;
  WORKER_CAPACITY_BYTES = 2;
  WORKER_CAPACITY_BYTES_ON_TIERS = 3;
  ID = 4;
  LAST_CONTACT_SEC = 5;
  START_TIME_MS = 6;
  STATE = 7;
  WORKER_USED_BYTES = 8;
  WORKER_USED_BYTES_ON_TIERS = 9;
  BLOCK_COUNT = 10;
  BUILD_VERSION = 11;
  NUM_VCPU = 12;
}

message GetWorkerReportPOptions {
  /** addresses are only valid when workerRange is SPECIFIED */
  repeated string addresses = 1;
  repeated WorkerInfoField fieldRanges = 2;
  optional WorkerRange workerRange = 3;
}
message GetWorkerInfoListPOptions {}
message GetWorkerInfoListPResponse {
  repeated WorkerInfo workerInfos = 1;
}

message WorkerLostStorageInfo {
  optional grpc.WorkerNetAddress address = 1;
  /** a map from tier alias to the lost storage paths */
  map<string, StorageList> lostStorage = 2;
}
message RemoveDisabledWorkerPOptions {
  required string workerHostname = 1;
  optional int64 workerWebPort = 2;
}
message RemoveDisabledWorkerPResponse {}

message GetWorkerLostStoragePOptions {}
message GetWorkerLostStoragePResponse {
  repeated WorkerLostStorageInfo workerLostStorageInfo = 1;
}

message DecommissionWorkerPResponse {}
message DecommissionWorkerPOptions {
  required string workerHostname = 1;
  optional int64 workerWebPort = 2;
  optional bool canRegisterAgain = 3;
}

/**
 * This interface contains block master service endpoints for Alluxio clients.
 */
service BlockMasterClientService {

  /**
   * Returns the block information for the given block id.
   */
  rpc GetBlockInfo(GetBlockInfoPRequest) returns (GetBlockInfoPResponse);

  /**
    * Returns block master information.
    */
  rpc GetBlockMasterInfo(GetBlockMasterInfoPOptions) returns (GetBlockMasterInfoPResponse);

  /**
   * Returns the capacity (in bytes).
   */
  rpc GetCapacityBytes(GetCapacityBytesPOptions) returns(GetCapacityBytesPResponse);

  /**
   * Returns the used storage (in bytes).
   */
  rpc GetUsedBytes(GetUsedBytesPOptions) returns (GetUsedBytesPResponse);

  /**
   * Returns a list of workers information.
   */
  rpc GetWorkerInfoList(GetWorkerInfoListPOptions) returns (GetWorkerInfoListPResponse);

  /**
   * If target worker is in the decommissioned worker set,
   * return true, remove target worker from decommissioned worker set; else, return false.
   */
  rpc RemoveDisabledWorker(RemoveDisabledWorkerPOptions)
      returns (RemoveDisabledWorkerPResponse);

  /**
   * Returns a list of workers information for report CLI.
