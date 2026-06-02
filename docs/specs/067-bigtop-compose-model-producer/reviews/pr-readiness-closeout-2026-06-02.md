# PR Readiness Closeout: Spec 067

Date: 2026-06-02
Branch: `codex/067-bigtop-compose-model-producer`

## Scope

This slice generates real Docker Compose deployment-model producer outputs for
the Bigtop provisioner. It does not start containers, mutate Docker state, run
Bigtop provisioning, or claim runtime topology.

## Implementation State

verified:

- Docker Compose v5.1.4 is available.
- cgroup v2 Compose config YAML output generated with exit code `0`.
- cgroup v2 Compose config JSON output generated with exit code `0`.
- cgroup v1 Compose config JSON output generated with exit code `0`.
- No stderr was emitted by the successful Compose config runs.
- cgroup v2 model resolves one `bigtop` service and one default network.
- The service resolves image `bigtop/puppet:trunk-ubuntu-24.04`, command
  `/sbin/init`, privileged mode, domain `bigtop.apache.org`, four bind mounts,
  and memory limit `4294967296`.
- cgroup v1/v2 mount asymmetry is recorded: cgroup v1 includes read-only
  `/sys/fs/cgroup`, cgroup v2 omits it.
- Output hashes and sizes were recorded externally.

Cursor stress:

- Cursor Agent `composer-2.5` preserved Compose config output as
  `metadata-visible` deployment-model evidence.
- Cursor preserved runtime topology, runtime container IDs/IPs/ports/health,
  process state, and enterprise architecture parity as `cannot_verify`.

Review evidence:

- DeepSeek V4 Pro assessed.
- Kimi for Coding assessed.
- GLM 5.1 assessed.
- Accepted findings were fixed and dispositioned.

## Local Verification

verified:

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

## Evidence State After This Slice

verified:

- Real Docker Compose deployment-model producer outputs for Bigtop cgroup v1
  and cgroup v2 provisioner variants.
- Cursor boundary preservation.
- Independent review disposition.
- Local baseline.

cannot_verify:

- Bigtop runtime topology.
- Running container IDs, IPs, ports, health, and process state.
- Full symbol/reference graph.
- Call graph.
- Enterprise architecture parity.

blocked:

- Runtime-visible validation of the Compose model requires explicit approval to
  start Bigtop containers and capture runtime observations.

not_assessed:

- GitHub checks before PR creation.
- GitHub review approval.

## PR Readiness Decision

Ready-for-review PR: yes, after commit, push, PR creation, and GitHub checks.

Ready-to-merge PR: not_assessed.

Merge approval: not_assessed.
