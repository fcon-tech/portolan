# Provisioner Read-Only Inspection

Date: 2026-06-02
Target:
`/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker`

## Inspected Files

verified:

- `README.md`
- `docker-hadoop.sh`
- `docker-compose.yml`
- `docker-compose-cgroupv2.yml`
- `config_ubuntu-24.04.yaml`
- `config_debian-12.yaml`
- `config_fedora-40.yaml`
- `config_openeuler-22.03.yaml`
- `config_rockylinux-9.yaml`

## Raw Read-Only Evidence

verified:

```text
wc -l:
  153 README.md
   24 config_ubuntu-24.04.yaml
   28 docker-compose.yml
  485 docker-hadoop.sh

sha256:
600b57464b0a7834b96bc067a14410f4679fbf1fa50443be38f487ea76c6d2b6  README.md
2c90a8d0eaf0b260914104325296e5f005b745f9fe0096e6f3d7aa0bbb68881c  config_ubuntu-24.04.yaml
3fcb7b6218e4c8b21d8dc402749a463a07f3e03d08447be3b6580641bd2c77c0  docker-compose.yml
7b472404cb60495be54bdf56430031c126eeef8da985d12234c14a1b034eade1  docker-hadoop.sh
```

Relevant command/config lines were found with read-only search:

- `docker-hadoop.sh` documents `--create`, `--destroy`, `--exec`, `--list`,
  `--provision`, and `--smoke-tests`.
- `config_ubuntu-24.04.yaml` declares image
  `bigtop/puppet:trunk-ubuntu-24.04`, Bigtop release repo, and components
  `[hdfs, yarn, mapreduce]`.
- `docker-compose.yml` declares image `${DOCKER_IMAGE}`, `privileged: true`,
  and memory limit `${MEM_LIMIT}`.

## Relevant Upstream Behavior

verified by direct file inspection:

- `README.md` describes the Docker provisioner as a Docker Compose wrapper that
  creates a Bigtop virtual Hadoop cluster on Docker containers.
- The documented create command is `./docker-hadoop.sh --create NUM_INSTANCES`.
- The documented cleanup command is `./docker-hadoop.sh --destroy`.
- The wrapper supports `--list`, `--exec`, `--provision`, `--smoke-tests`,
  `--stack`, `--memory`, alternate config files, and Docker Compose plugin mode.
- `config_ubuntu-24.04.yaml` selects image `bigtop/puppet:trunk-ubuntu-24.04`,
  memory limit `4g`, repo
  `http://repos.bigtop.apache.org/releases/3.5.0/ubuntu/24.04/$(ARCH)`, and
  components `[hdfs, yarn, mapreduce]`.
- `docker-compose.yml` defines a privileged `bigtop` service using `/sbin/init`,
  domain `bigtop.apache.org`, `/sys/fs/cgroup` mount, and bind mounts into
  `/bigtop-home` and generated config files.
- `docker-hadoop.sh` writes `.provision_id`, creates `config/hieradata`,
  generates `config/hiera.yaml`, `config/hosts`, starts containers with Docker
  Compose, runs Docker inspect/exec/cp, applies Puppet, can run smoke tests, and
  removes containers/networks/config on destroy.

## Safety Boundary

Preflight-only:

- File inspection.
- Parsing YAML/Compose files.
- Checking local tool versions if no daemon state is mutated.

Approval-required:

- `--create`, `--provision`, `--smoke-tests`, and `--destroy`.
- `--exec` against any provisioned Bigtop container.
- Any Docker Compose `up`, `stop`, `rm`, or Docker network removal.
- Any `docker exec` into provisioned Bigtop containers.

## Decision

Selected candidate: upstream Bigtop Docker provisioner.

Rejected alternatives:

- Juju bundles: larger orchestrator and network/resource boundary.
- Puppet manifests alone: not runtime-visible.
- Static Docker Compose inspection: metadata only.

Reversibility:

- Intended cleanup is `./docker-hadoop.sh --destroy`, followed by explicit
  post-cleanup Docker container/network checks.

Risk if wrong:

- A provisioned cluster could leave privileged containers, networks, generated
  config, or pulled images behind; runtime evidence could be overclaimed if
  cleanup or component process checks are absent.

Confidence: high for choosing this as the smallest upstream runtime candidate;
medium for actual run feasibility until preflight and explicit approval are
recorded.
