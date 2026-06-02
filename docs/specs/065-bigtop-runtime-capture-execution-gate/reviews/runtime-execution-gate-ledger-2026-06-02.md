# Runtime Execution Gate Ledger: Spec 065

Date: 2026-06-02
External output root:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-065-runtime-execution-gate/tool-outputs`

## Runtime Surface Summary

verified:

```text
runtime_surface	state	evidence
docker_bigtop_containers	not_found	docker-ps.tsv
kubernetes_bigtop_pods	not_found	kubectl-pods-wide.txt
bigtop_service_processes	not_found	process-scan.txt
bigtop_runtime_candidate_runbook	found	runtime-candidate-files.txt
```

Interpretation:

- No currently running Bigtop runtime topology was found in Docker.
- No currently running Bigtop runtime topology was found in Kubernetes.
- No currently running Bigtop/Hadoop/HDFS/YARN/ZooKeeper/HBase/Hive/Spark
  service process was found on the host.
- The Bigtop Docker provisioner runbook is present, but runbook existence is
  not runtime-visible evidence.

## Docker Surface

verified:

```text
e7d50b5a0ca8	faust-web:staging	faust-staging-web-1	Up 7 hours
f497d810815c	faust-api:staging	faust-staging-api-1	Up 7 hours (healthy)
0dc6df24835d	bvevvs-registation-bot-bot	bvevvs-bot-dev	Up 9 hours
d6e9d1708645	apache/tika:latest	faust-staging-tika-1	Up 7 days
06a82357c053	gcr.io/k8s-minikube/kicbase:v0.0.48	minikube	Up 7 days
```

These containers are unrelated to Bigtop runtime topology.

## Kubernetes Surface

verified:

- `kubectl get pods -A -o wide` returned only minikube system pods and an
  unrelated `personal-beetles-1/openclaw` pod.
- No Bigtop/Hadoop/HDFS/YARN/ZooKeeper/HBase/Hive/Spark pod was present.

## Process Surface

verified:

- `process-scan.txt` is zero bytes after service-token matching.
- A prior broad substring scan produced a false positive on `ssh sparky`; the
  probe was corrected to avoid treating the `spark` substring inside an
  unrelated host name as runtime evidence.
- Future process probes must match Bigtop/Hadoop service tokens as standalone
  command tokens or service identifiers, not arbitrary substrings inside host
  names, usernames, paths, or unrelated command arguments.

## Candidate Runtime Runbook

verified:

- `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker/docker-hadoop.sh`
  exists.
- `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker/docker-compose.yml`
  exists.
- `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker/docker-compose-cgroupv2.yml`
  exists.

cannot_verify:

- Bigtop runtime topology.
- Runtime services, ports, networks, and inter-service dependencies.

blocked pending explicit runtime execution approval:

```bash
cd /home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker
./docker-hadoop.sh --docker-compose-plugin --create 1
```

## Future Runtime Evidence Acceptance Checklist

accepted after explicit approval:

- Bigtop-specific `docker ps` rows.
- Bigtop-specific `docker inspect` rows for containers, networks, ports,
  labels, mounts, and project metadata.
- Bigtop provisioner service, smoke, or health output from the approved runbook.
- Cleanup command and post-cleanup residue evidence if the approved run requires
  teardown.

rejected substitutes:

- Static compose files, Helm charts, Puppet manifests, ctags, Semgrep, SBOM, or
  dependency outputs.
- Unrelated Docker containers, Kubernetes pods, host processes, or minikube
  control-plane objects.
- Bigtop runbook existence without a run.
- Preflight/env-check success without create/capture output.

## Output Integrity

`sha256.txt` and `sizes.txt` were recorded under the external output root.

## Claim Boundary

verified:

- Current local read-only runtime surfaces do not contain a Bigtop runtime.
- The upstream Bigtop Docker provisioner remains the concrete runtime capture
  candidate.

cannot_verify:

- Runtime topology.
- Enterprise code-intelligence parity.

not_assessed:

- Actual Bigtop create/provision/smoke-test behavior.
- Cleanup behavior after a real create run.
