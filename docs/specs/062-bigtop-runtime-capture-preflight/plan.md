# Implementation Plan: Bigtop Runtime Capture Preflight

**Branch**: `codex/062-bigtop-runtime-capture-preflight`

**Spec**: `docs/specs/062-bigtop-runtime-capture-preflight/spec.md`

## Summary

Record non-mutating runtime prerequisites for the Bigtop Docker provisioner and
leave the actual single-node runtime capture blocked on explicit design
approval.

## Decision Gate

- **Simpler/Faster**: Run `./docker-hadoop.sh --create 1` now. Rejected because
  Spec 061 classifies that as approval-required runtime provisioning.
- **Blocking Edge Cases**: The create path mutates Docker state, can pull images
  and packages, writes provisioner state, runs privileged containers, and needs
  cleanup. Preflight readiness does not remove that approval boundary.
- **Existing Open Source**: Use Apache Bigtop's own `docker-hadoop.sh
  --env-check` plus standard Docker/Compose/Ruby version probes. Do not build a
  Portolan-owned runtime probe.

## Scope

In scope:

- Read-only prerequisite checks.
- External preflight output directory under `.portolan/stress/`.
- Preflight ledger and hashes.
- Explicit next approval gate.

Out of scope:

- Starting containers.
- Pulling images or packages.
- Running smoke tests.
- Mutating Docker networks or containers.
- Claiming runtime topology is verified.
- Controlled negative-path prerequisite simulation.

## Preflight Commands

Recorded externally under:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-062-runtime-preflight/tool-outputs/
```

Commands:

```bash
docker --version
docker compose version
ruby --version
docker info --format '{{.CgroupVersion}}'
./docker-hadoop.sh --docker-compose-plugin --env-check
sha256sum tool-outputs/*.txt
wc -c tool-outputs/*.txt
```

## Preflight Result

verified:

- Docker: `Docker version 29.5.2, build 79eb04c7d8`
- Docker Compose: `Docker Compose version v5.1.4`
- Ruby: `ruby 4.0.5 (2026-05-20 revision 64336ffd0e) +PRISM [x86_64-linux]`
- Docker cgroup version: `2`
- Bigtop env check with Docker Compose plugin mode passed.

cannot_verify:

- Bigtop runtime topology. No runtime was started.

blocked pending explicit approval:

- `./docker-hadoop.sh --create 1`

not_assessed:

- Negative-path prerequisite behavior when Docker, Docker Compose, Ruby, cgroup
  support, or Bigtop env-check are unavailable.

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
