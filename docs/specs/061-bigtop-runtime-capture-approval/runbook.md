# Bigtop Runtime Capture Approval Runbook

Date: 2026-06-02

## Purpose

Define the approval boundary for a future Bigtop runtime capture. This runbook
does not approve or execute runtime provisioning by itself.

## Approval State Model

Allowed states:

- `pending`: approval has not been granted or denied.
- `approved`: explicit design approval has been recorded for the named command
  scope.
- `blocked`: runtime capture cannot proceed because approval, tools, resources,
  network access, or cleanup safety is unavailable.

Current runtime provisioning approval: `pending`.

Until approval changes to approved in this spec or a follow-up implementation
spec, Bigtop runtime topology remains `cannot_verify`.

## Candidate Runtime Path

Directory:

```text
/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker
```

Selected upstream tooling:

```text
./docker-hadoop.sh
```

Minimal candidate stack:

```text
config_ubuntu-24.04.yaml
components: hdfs, yarn, mapreduce
initial node count: 1
```

## Preflight-Only Commands

Allowed before approval:

```bash
sed -n '1,220p' README.md                  # read-only excerpt
sed -n '1,180p' config_ubuntu-24.04.yaml   # read-only full-file-or-excerpt
sed -n '1,220p' docker-compose.yml         # read-only full-file-or-excerpt
sed -n '1,260p' docker-hadoop.sh           # read-only excerpt
```

Optional local tool checks, if needed:

```bash
docker --version
docker compose version
ruby --version
```

These checks do not prove runtime topology.

Conditionally read-only after a cluster exists:

```bash
./docker-hadoop.sh --list
```

`--list` may be used only as part of an approved capture or cleanup audit
against the selected provisioner directory. It is not sufficient runtime
evidence by itself.

## Approval-Required Commands

Do not run without explicit design approval:

```bash
./docker-hadoop.sh --create 1
./docker-hadoop.sh --create 1 --stack hdfs
./docker-hadoop.sh --provision
./docker-hadoop.sh --smoke-tests hdfs
./docker-hadoop.sh --destroy
./docker-hadoop.sh --exec 1 <read-only-observation-command>
docker compose up
docker compose stop
docker compose rm
docker network rm
docker exec ...
```

Reason: these commands can create or remove containers/networks, write
provisioner state, pull images/packages, run privileged containers, or execute
inside runtime containers.

Initial approved capture should be single-node only unless a later approval
explicitly expands the node count, wall-clock budget, and cleanup plan.

`--exec` is approval-required whenever it targets a provisioned Bigtop
container. Even read-only component checks execute inside runtime containers and
must stay inside the approved capture scope.

## Risk Review

Resource use:

- `config_ubuntu-24.04.yaml` sets a `4g` container memory limit. A multi-node
  run multiplies that limit and can contend with other local workloads.

Network and image pulls:

- The selected image is `bigtop/puppet:trunk-ubuntu-24.04`.
- The selected package repo is
  `http://repos.bigtop.apache.org/releases/3.5.0/ubuntu/24.04/$(ARCH)`.
- Image and package acquisition can use external network access and may fail or
  drift over time.

Privileged containers:

- `docker-compose.yml` sets `privileged: true` and mounts `/sys/fs/cgroup`.

Filesystem writes:

- The provisioner can create `.provision_id`, `config/hiera.yaml`,
  `config/hosts`, `config/hieradata`, and `.error_msg*` inside the provisioner
  directory.

Credentials:

- No credential files are required by the selected runbook.
- Do not pass private package repositories, Docker registry credentials, Nexus
  credentials, Kubernetes config, or SSH material into the capture without a
  separate privacy review.

Cleanup:

- Cleanup must run `./docker-hadoop.sh --destroy` or an explicitly approved
  equivalent cleanup plan.
- Post-cleanup evidence must show Bigtop containers and provisioner networks are
  absent.
- Manual fallback cleanup is not pre-approved. If `--destroy` fails, any direct
  `docker compose rm`, `docker rm -f`, or `docker network rm` fallback must be
  separately approved, scoped to the `.provision_id` compose project/network,
  and followed by the same post-cleanup evidence checks.

## Required Capture Outputs After Approval

A future approved run should write outputs outside the target repository under a
dated `.portolan/stress/` directory and record hashes.

Required:

```text
command-transcript.txt
provision-id.txt
docker-ps-before.tsv
docker-network-before.tsv
docker-create-output.txt
docker-ps-after-create.tsv
docker-network-after-create.tsv
docker-inspect-containers.json
docker-inspect-networks.json
component-process-checks.txt
smoke-tests-output.txt
destroy-output.txt
docker-ps-after-destroy.tsv
docker-network-after-destroy.tsv
sha256.txt
```

## Sufficient Evidence For `runtime-visible`

All of the following must be present:

- successful create/provision command exit status;
- single-node capture scope, unless a broader node count is explicitly approved;
- Bigtop container rows from `docker ps`;
- Docker inspect metadata for the Bigtop containers and network;
- at least one Bigtop component process or service observation inside the
  provisioned container;
- cleanup transcript and post-cleanup evidence.

## Insufficient Evidence

Do not classify as `runtime-visible` from:

- Docker Compose files;
- Puppet manifests;
- README commands;
- generated config files before startup;
- Universal Ctags symbols;
- selected source files;
- unrelated minikube or non-Bigtop Docker containers.

## Stop Conditions

Stop and record `blocked` or `cannot_verify` if:

- approval is not granted;
- Docker is unavailable;
- required images or packages cannot be acquired;
- create/provision fails before component observations exist;
- cleanup cannot be verified.

## Requirement Traceability

| Requirement | Covered by |
| --- | --- |
| FR-001 | Approval state model; approval-required command list |
| FR-002 | Provisioner read-only inspection artifact |
| FR-003 | Candidate runtime path; rejected alternatives |
| FR-004 | Approval-required command list; risk review |
| FR-005 | Required capture outputs; cleanup risk |
| FR-006 | Current approval state and sufficient evidence rules |
| FR-007 | Insufficient evidence section |
| FR-008 | Approval state model |
