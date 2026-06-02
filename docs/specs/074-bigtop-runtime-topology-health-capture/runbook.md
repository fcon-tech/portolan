# Runtime Topology Health Capture Approval Packet

Spec: `docs/specs/074-bigtop-runtime-topology-health-capture/`

Date: 2026-06-02

## Purpose

This packet is the exact approval surface for the next runtime execution. It
exists so approval can be granted or denied against a named command sequence,
timeout, artifact contract, and cleanup plan.

## Required Approval Text

Any of the following is sufficient if it clearly refers to spec 074:

- `разрешаю 074`
- `approve spec 074 runtime health capture`
- a longer approval that explicitly accepts the command sequence below.

## Approved Command Sequence Needed

Working directory:

```text
/home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/provisioner/docker
```

Commands:

```bash
./docker-hadoop.sh --docker-compose-plugin --create 1
./docker-hadoop.sh --docker-compose-plugin --exec 1 bash -lc '<read-only health commands from plan.md>'
./docker-hadoop.sh --docker-compose-plugin --smoke-tests hdfs,yarn,mapreduce
./docker-hadoop.sh --docker-compose-plugin --destroy
```

## Safety Bounds

- One Bigtop Docker provisioner node.
- Upstream default memory limit: `4g`.
- Create/provision timeout: 20 minutes.
- Health/smoke timeout: 10 minutes.
- Cleanup/destroy is required even after failures.
- Manual direct Docker cleanup is allowed only for resources uniquely identified
  by the active `.provision_id`; otherwise it needs separate approval.

## Output Root

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-074-runtime-topology-health-capture/tool-outputs/
```

## Stop Conditions

Stop and record `failed`, `cannot_verify`, or `blocked` if:

- Docker/provisioner create fails before a container exists.
- Required service-health commands cannot run.
- Cleanup cannot be verified.
- The command sequence exceeds approved timeout.
- The target repository is left dirty after cleanup.

## Claim Boundary

Approval authorizes runtime evidence collection. It does not pre-approve a
verified topology claim.

The final topology claim is decided only from captured service-health, smoke,
daemon-log, and cleanup evidence.
