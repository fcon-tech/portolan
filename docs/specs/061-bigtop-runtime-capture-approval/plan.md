# Implementation Plan: Bigtop Runtime Capture Approval

**Branch**: `codex/061-bigtop-runtime-capture-approval`

**Spec**: `docs/specs/061-bigtop-runtime-capture-approval/spec.md`

## Summary

Define a safe approval and capture path for Bigtop runtime topology. This slice
does not start Bigtop. It turns the PR #38 `cannot_verify` result into a
concrete approval packet and runbook for the next runtime-visible capture.

## Decision Gate

- **Simpler/Faster**: Run another read-only Docker/Kubernetes/process probe.
  Rejected because PR #38 already did that and found no Bigtop runtime-visible
  observations.
- **Blocking Edge Cases**: Starting the upstream Docker provisioner mutates local
  Docker state, creates containers/networks, writes `config/`, `.provision_id`,
  and `.error_msg*`, may pull images and packages over the network, uses
  privileged containers, and requires cleanup.
- **Existing Open Source**: Use Apache Bigtop's own Docker provisioner as the
  candidate runtime path. Portolan should capture and normalize its observable
  outputs rather than implement a runtime scanner.

## Technical Context

- Primary language: Go, but this slice is documentation and evidence only.
- Runtime target: Apache Bigtop Docker provisioner.
- Candidate path:
  `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker`.
- Candidate config:
  `config_ubuntu-24.04.yaml` with `hdfs`, `yarn`, and `mapreduce`.
- Upstream create command family:
  `./docker-hadoop.sh --create NUM_INSTANCES`.
- Upstream cleanup command family:
  `./docker-hadoop.sh --destroy`.

## Scope

In scope:

- Read-only inspection of Bigtop provisioner docs, config, compose files, and
  wrapper script.
- Approval-required runtime capture runbook.
- Accepted/insufficient evidence definitions.
- Cursor boundary stress prompt/output.
- Review disposition and baseline verification.

Out of scope:

- Starting containers.
- Running smoke tests.
- Pulling images or packages.
- Writing to the Bigtop target repository.
- Adding Portolan runtime scanner code.
- Claiming runtime topology or enterprise parity is verified.

## Runtime Capture Candidate

Selected candidate:

- Apache Bigtop Docker provisioner under `provisioner/docker`.
- Reason: upstream tooling is purpose-built to create a Bigtop Hadoop cluster on
  Docker containers and includes create, list, exec, provision, smoke-test, and
  destroy commands.

Rejected alternatives:

- Juju bundles under `bigtop-deploy/juju`: heavier external orchestrator surface
  and larger approval boundary.
- Puppet manifests alone under `bigtop-deploy/puppet`: deployment logic but not
  a runtime by itself.
- Static Docker Compose/Puppet inspection only: useful metadata, insufficient
  for `runtime-visible`.
- Another local runtime probe without provisioning: already completed by PR #38.

## Approval Boundary

Preflight-only commands may inspect files and tool availability. They must not
create containers, pull images, mutate Docker networks, write provisioner state,
or start daemons.

Approval-required commands include:

- `./docker-hadoop.sh --create 1`
- `./docker-hadoop.sh --create 1 --stack hdfs`
- `./docker-hadoop.sh --provision`
- `./docker-hadoop.sh --smoke-tests ...`
- `./docker-hadoop.sh --destroy`
- any direct `docker compose up`, `docker compose rm`, `docker network rm`, or
  `docker exec` command against provisioned Bigtop containers.

## Acceptable Runtime-Visible Outputs

A follow-up runtime capture can classify bounded Bigtop topology as
`runtime-visible` only if it records, at minimum:

- provisioner command transcript and exit status;
- `.provision_id` value if created;
- `docker ps` rows for Bigtop containers;
- Docker network rows for the provisioner project;
- `docker inspect` JSON for Bigtop containers and networks;
- component process checks inside the container, such as HDFS/YARN/MapReduce
  process or service status;
- optional smoke-test output for selected components;
- cleanup command transcript and post-cleanup `docker ps` / `docker network ls`
  evidence.

Static files, generated configs before startup, ctags symbols, README guidance,
Puppet manifests, Docker Compose files, and Juju bundles are insufficient.

## Verification

Documentation-only baseline:

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

No runtime command may be executed in this slice.
