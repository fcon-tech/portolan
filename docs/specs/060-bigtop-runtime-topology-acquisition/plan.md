# Implementation Plan: Bigtop Runtime Topology Acquisition

**Branch**: `codex/060-bigtop-runtime-topology-acquisition` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

## Summary

Probe existing local runtime surfaces for Bigtop runtime-visible evidence without
starting services or mutating Docker/Kubernetes/target repositories. If no
Bigtop runtime is present, record exact evidence and keep runtime topology
`not_assessed` or `cannot_verify`.

## Technical Context

Known state before this slice:

- Spec 058 found `selection.json` runtime/tool output fields were null.
- Local Docker showed unrelated Faust/Tika/minikube containers.
- `kubectl` context is `minikube`, but no Bigtop workload has been verified.
- Static Docker Compose/Helm/protobuf/ctags evidence exists but is not runtime.

## Decision Gate

- Simpler/Faster: run read-only runtime probes against existing local surfaces.
- Blocking Edge Cases: starting Bigtop would mutate runtime state and needs
  separate design approval; unrelated minikube state is not Bigtop topology.
- Existing Open Source: use existing local Docker and Kubernetes CLIs as runtime
  observation producers; do not build a Portolan runtime scanner here.

## Verification

Run:

```bash
go test -count=1 ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

Record runtime probe outputs under
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-060-runtime-topology/`.
