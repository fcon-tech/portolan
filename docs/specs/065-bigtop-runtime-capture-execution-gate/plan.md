# Implementation Plan: Bigtop Runtime Capture Execution Gate

**Branch**: `codex/065-bigtop-runtime-capture-execution-gate`

**Spec**: `docs/specs/065-bigtop-runtime-capture-execution-gate/spec.md`

## Summary

Record the current absence of Bigtop runtime-visible surfaces and make the
remaining runtime execution gate precise enough that a later approved capture
can produce acceptable runtime topology evidence without overclaiming static
signals.

## Decision Gate

- **Simpler/Faster**: Run `./docker-hadoop.sh --docker-compose-plugin --create
  1` immediately and capture containers. Rejected for this slice because it
  starts services, mutates Docker state, may pull images/packages, and is still
  approval-required.
- **Blocking Edge Cases**: Runtime capture can consume significant resources,
  start privileged or long-running containers, mutate Docker networks/volumes,
  execute Bigtop provisioning logic, and require cleanup. Static compose files
  and existing unrelated containers are not runtime topology evidence.
- **Existing Open Source**: Use Apache Bigtop's upstream Docker provisioner as
  the runtime source, plus standard Docker, Kubernetes, and process surfaces for
  observation. Do not build a Portolan-owned runtime scanner.

## Scope

In scope:

- Fresh read-only Docker/Kubernetes/process runtime surface probes.
- Runtime candidate runbook discovery.
- External output directory under `.portolan/stress/`.
- Hash and size evidence.
- Explicit accepted outputs for a future approved runtime capture.
- Cursor boundary stress.
- Independent review and disposition.

Out of scope:

- Starting or stopping containers.
- Pulling images or packages.
- Running provisioning, smoke tests, `docker compose up`, or `docker exec`.
- Changing target repositories.
- Full runtime topology verification.

## Recorded External Outputs

External output root:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-065-runtime-execution-gate/tool-outputs/
```

Files:

- `docker-ps.tsv`
- `kubectl-pods-wide.txt`
- `process-scan.txt`
- `runtime-candidate-files.txt`
- `runtime-surface-summary.tsv`
- `sha256.txt`
- `sizes.txt`

## Current Probe Result

verified:

- Docker running containers were inspected read-only.
- Kubernetes pods were inspected read-only.
- Local processes were inspected read-only with service-token matching.
- No Bigtop/Hadoop/HDFS/YARN/ZooKeeper/HBase/Hive/Spark service runtime was
  found in Docker, Kubernetes, or process surfaces.
- The upstream Bigtop Docker provisioner runbook exists at
  `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker/docker-hadoop.sh`.

cannot_verify:

- Bigtop runtime topology.

blocked pending explicit runtime execution approval:

- `cd /home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker`
- `./docker-hadoop.sh --docker-compose-plugin --create 1`

## Accepted Outputs For A Future Approved Capture

The following would count as runtime-visible evidence after approval:

- Bigtop-specific `docker ps` rows showing expected container names/images and
  running status.
- Bigtop-specific `docker inspect` metadata for running containers, networks,
  mounts, exposed ports, and labels.
- Bigtop-specific process/service status collected through approved provisioner
  commands.
- Bigtop smoke-test or health output produced by the approved runbook.
- Cleanup evidence showing the created Bigtop runtime was stopped/destroyed
  after capture if the approval requires cleanup.

Future probes must filter on Bigtop-specific container names, images, labels,
compose project names, pod names, namespaces, service names, or process command
tokens. Broad substring matching is insufficient; this slice already corrected
a false positive where `ssh sparky` matched the substring `spark` without being
a Spark or Bigtop runtime process.

The following remain insufficient:

- Static `docker-compose.yml`, Helm charts, Puppet manifests, ctags, Semgrep,
  SBOM, or dependency outputs.
- Unrelated local containers, minikube pods, or host processes.
- Bigtop runbook existence without a run.
- Preflight/env-check success without create/capture output.

## Cleanup Plan For A Future Approved Capture

If runtime execution is approved, the run must record the exact cleanup command
from the Bigtop provisioner runbook before create is executed. At minimum the
future capture spec must verify:

- containers created by the capture;
- networks/volumes created or reused by the capture;
- stop/destroy command and exit code;
- post-cleanup `docker ps` / `docker network ls` evidence scoped to the created
  Bigtop resources;
- whether any residue remains as `verified`, `failed`, or `cannot_verify`.

## Future Capture Checklist

Before any approved create run:

- Record the explicit approval artifact and scope.
- Record resource and cleanup expectations.
- Record the exact create command and working directory.
- Record the strict Bigtop-specific matching rules used for Docker,
  Kubernetes, and process observations.

After any approved create run:

- Capture Bigtop-specific `docker ps` output.
- Capture Bigtop-specific `docker inspect` output for containers, networks,
  ports, labels, mounts, and project metadata.
- Capture approved provisioner service/smoke/health output.
- Capture cleanup command, exit code, and post-cleanup residue checks.
- Preserve `cannot_verify` for any runtime relationship not directly supported
  by the captured runtime-visible observations.

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
