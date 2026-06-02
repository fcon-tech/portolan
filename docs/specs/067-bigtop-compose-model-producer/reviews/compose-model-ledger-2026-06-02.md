# Compose Model Ledger: Spec 067

Date: 2026-06-02
External output root:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-067-compose-model-producer/tool-outputs`

## Tool Availability

verified:

```text
Docker Compose version v5.1.4
```

Docker Compose is the OSS producer. No Portolan-owned Compose parser was
implemented.

## Producer Inputs

verified:

- `docker-compose.yml`
- `docker-compose-cgroupv2.yml`
- `config_ubuntu-24.04.yaml`
- `DOCKER_IMAGE=bigtop/puppet:trunk-ubuntu-24.04`
- `MEM_LIMIT=4g`

## Producer Results

verified:

```text
producer	exit_code	output_bytes	stderr_bytes
bigtop-compose-cgroupv2-config-yaml	0	1011	0
bigtop-compose-cgroupv2-config-json	0	1373	0
bigtop-compose-cgroupv1-config-json	0	1546	0
```

No stderr was emitted by the successful Compose config runs.

## cgroup v2 Model Summary

verified:

```text
services	1
networks	1
volumes	0
configs	0
secrets	0
```

service:

```text
bigtop	bigtop/puppet:trunk-ubuntu-24.04	/sbin/init	true	4294967296	4	bigtop.apache.org
```

volumes:

```text
bind	/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo	/bigtop-home	null
bind	/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker/config/hiera.yaml	/etc/puppet/hiera.yaml	null
bind	/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker/config/hieradata	/etc/puppet/hieradata	null
bind	/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker/config/hosts	/etc/hosts	null
```

## Variant Comparison

verified:

```text
variant	service_count	network_count	volume_mount_count	privileged	mem_limit_bytes	has_sys_fs_cgroup_mount
cgroupv1	1	1	5	true	4294967296	true
cgroupv2	1	1	4	true	4294967296	false
```

Interpretation:

- Both variants define one `bigtop` service and one default network.
- Both variants resolve the service image, command, domain, privileged mode,
  and memory limit.
- The cgroup v1 variant includes a read-only `/sys/fs/cgroup` bind mount; the
  cgroup v2 variant omits it. This is source-model driven:
  `docker-compose.yml` contains `/sys/fs/cgroup:/sys/fs/cgroup:ro`, while
  `docker-compose-cgroupv2.yml` omits that bind mount for the cgroup v2 path.
  This slice records the difference as producer metadata and does not modify the
  external Bigtop repository.

## Output Integrity

verified:

- `sha256.txt` records hashes for generated model outputs, summaries, source
  copies, stderr, and exit-code files.
- `sizes.txt` records byte sizes for generated outputs.

## Claim Boundary

verified:

- Real Docker Compose deployment-model producer outputs exist for the Bigtop
  Docker provisioner.

cannot_verify:

- Runtime topology.
- Running container IDs, IPs, ports, networks, health, and process state.
- Full architecture parity.

blocked:

- Runtime-visible validation of this model requires explicit approval to start
  Bigtop containers and capture runtime observations.

## Lifecycle Closure

verified:

- No Docker mutation command was run for this slice.
- No target repository file was modified.
- No additional producer run is required for PR readiness after review
  disposition and baseline verification, unless new findings contradict this
  ledger.
