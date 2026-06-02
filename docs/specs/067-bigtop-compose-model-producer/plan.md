# Implementation Plan: Bigtop Compose Model Producer

**Branch**: `codex/067-bigtop-compose-model-producer`

**Spec**: `docs/specs/067-bigtop-compose-model-producer/spec.md`

## Summary

Use Docker Compose's own `config` producer to generate normalized deployment
model output for the Bigtop Docker provisioner without starting containers.

## Decision Gate

- **Simpler/Faster**: Read `docker-compose.yml` directly. Rejected because raw
  YAML is source-visible configuration, while `docker compose config` is a real
  Compose-normalized producer output with resolved environment variables.
- **Blocking Edge Cases**: `docker compose up/create/start/exec` would mutate
  Docker state and remains approval-required. Compose config output is not
  runtime topology because it does not observe running containers, networks,
  ports, or processes.
- **Existing Open Source**: Use Docker Compose v5.1.4. Do not implement a
  Compose parser in Portolan.

## Scope

In scope:

- cgroup v2 `docker compose config` YAML and JSON outputs.
- cgroup v1 `docker compose config --format json` output.
- Summary of service/network/mount metadata.
- Hashes and sizes for output integrity.
- Cursor boundary stress and independent review.

Out of scope:

- `docker compose up`, `create`, `start`, `exec`, or Bigtop runbook mutation.
- Runtime topology verification.
- Image pull validation.
- Multi-node scale runtime behavior.

## External Outputs

External output root:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-067-compose-model-producer/tool-outputs/
```

Key files:

- `bigtop-compose-cgroupv2-config.yaml`
- `bigtop-compose-cgroupv2-config.json`
- `bigtop-compose-cgroupv1-config.json`
- `compose-run-summary.tsv`
- `compose-cgroupv2-counts.tsv`
- `compose-cgroupv2-services.tsv`
- `compose-cgroupv2-volumes.tsv`
- `compose-cgroupv1-volumes.tsv`
- `compose-variant-comparison.tsv`
- `sha256.txt`
- `sizes.txt`

## Producer Results

verified:

```text
producer	exit_code	output_bytes	stderr_bytes
bigtop-compose-cgroupv2-config-yaml	0	1011	0
bigtop-compose-cgroupv2-config-json	0	1373	0
bigtop-compose-cgroupv1-config-json	0	1546	0
```

cgroup v2 model summary:

```text
services	1
networks	1
volumes	0
configs	0
secrets	0
```

cgroup v2 service summary:

```text
bigtop	bigtop/puppet:trunk-ubuntu-24.04	/sbin/init	true	4294967296	4	bigtop.apache.org
```

variant comparison:

```text
variant	service_count	network_count	volume_mount_count	privileged	mem_limit_bytes	has_sys_fs_cgroup_mount
cgroupv1	1	1	5	true	4294967296	true
cgroupv2	1	1	4	true	4294967296	false
```

Interpretation:

- Bigtop's Compose deployment model has one `bigtop` service and one default
  network in both variants.
- The service uses image `bigtop/puppet:trunk-ubuntu-24.04`, command
  `/sbin/init`, domain `bigtop.apache.org`, privileged mode, and a 4 GiB memory
  limit resolved to `4294967296` bytes.
- cgroup v1 includes a read-only `/sys/fs/cgroup` bind mount; cgroup v2 does
  not. This is source-model driven: `docker-compose.yml` contains the
  `/sys/fs/cgroup:/sys/fs/cgroup:ro` bind mount, while
  `docker-compose-cgroupv2.yml` intentionally omits that mount for the cgroup v2
  path. The Portolan slice records the difference in producer metadata and does
  not mutate the external Bigtop source files.

## Evidence Boundary

verified:

- Real Docker Compose deployment-model producer outputs exist for the Bigtop
  Docker provisioner.

cannot_verify:

- Runtime topology.
- Actual running container IDs, IPs, network attachments, ports, health, and
  process/service state.
- Full architecture parity.

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
