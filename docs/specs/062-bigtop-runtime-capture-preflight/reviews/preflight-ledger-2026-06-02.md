# Preflight Ledger: Spec 062

Date: 2026-06-02
Target root: `/home/fall_out_bug/projects/bigtop-landscape`
External output root:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-062-runtime-preflight/tool-outputs`

## Commands

verified:

| ID | Command | Output | Result |
| --- | --- | --- | --- |
| `docker-version` | `docker --version` | `docker-version.txt` | `Docker version 29.5.2, build 79eb04c7d8` |
| `docker-compose-version` | `docker compose version` | `docker-compose-version.txt` | `Docker Compose version v5.1.4` |
| `ruby-version` | `ruby --version` | `ruby-version.txt` | `ruby 4.0.5 (2026-05-20 revision 64336ffd0e) +PRISM [x86_64-linux]` |
| `docker-cgroup-version` | `docker info --format '{{.CgroupVersion}}'` | `docker-cgroup-version.txt` | `2` |
| `bigtop-env-check` | `./docker-hadoop.sh --docker-compose-plugin --env-check` | `bigtop-env-check.txt` | Environment check passed for Docker, Docker Compose plugin, and Ruby. |

## Output Integrity

verified:

```text
702ec68d5e77e91db3f2d374816912d561665c494f6e847e4cd0571f56c862cb  bigtop-env-check.txt
864995340098034dea6ad750a672cf05de8b38e1719255dcfe440b577dc97395  docker-cgroup-version.txt
590d1f8d8a1a671c42370e5f3624be118470bd768c96f2f3e4a4c8dad8ede9a4  docker-compose-version.txt
a85157516b0a0266cc3d1ed0055d61e135b7545f47254ec6567c3874ccb1e06b  docker-version.txt
f72fd725c0531780a2cebf9ab015a49e9ed6a6c9e137bbd5d9cd3ddb1abf9af2  ruby-version.txt
```

```text
262 bigtop-env-check.txt
 44 docker-cgroup-version.txt
 55 docker-compose-version.txt
 59 docker-version.txt
 83 ruby-version.txt
970 sha256.txt
```

`sha256.txt` is an aggregate hash witness for the other preflight outputs. Its
byte count is recorded for file-presence/size evidence, not as a self-hash.

The Docker daemon query is treated as read-only by Docker command semantics, but
it still contacts the Docker socket and may be visible to local audit/logging
systems.

## Classification

verified:

- Local prerequisites for an approved Bigtop Docker provisioner capture are
  present at preflight time.

cannot_verify:

- Bigtop runtime topology. No runtime containers, networks, services, endpoints,
  or component processes were created or observed by this preflight.

blocked pending explicit approval:

- `./docker-hadoop.sh --docker-compose-plugin --create 1`
- `./docker-hadoop.sh --docker-compose-plugin --provision`
- `./docker-hadoop.sh --docker-compose-plugin --smoke-tests ...`
- `./docker-hadoop.sh --docker-compose-plugin --destroy`
- `./docker-hadoop.sh --docker-compose-plugin --exec ...`
- Direct Docker Compose or Docker container/network mutation commands.

not_assessed:

- Negative-path prerequisite behavior when Docker, Docker Compose, Ruby, cgroup
  support, or Bigtop env-check are unavailable. This was not simulated because
  it would require environment mutation, dependency shadowing, or a dedicated
  harness outside this positive preflight slice.

## Next Approval Gate

The next runtime step, if approved, is:

```bash
cd /home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker
./docker-hadoop.sh --docker-compose-plugin --create 1
```

This command is not approved by this preflight.
