# Cursor Stress Ledger: Spec 075

Date: 2026-06-02
Branch: `codex/075-bigtop-producer-output-coverage-closure`
Model: Cursor Agent `composer-2.5`

## Lane Evidence

| Lane | Prompt | Output | Status |
| --- | --- | --- | --- |
| Cursor producer coverage claim-boundary stress | `stress/cursor-producer-coverage-prompt-2026-06-02.md` | `stress/cursor-producer-coverage-output-2026-06-02.md` | assessed |

The lane completed with:

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust "$(cat docs/specs/075-bigtop-producer-output-coverage-closure/stress/cursor-producer-coverage-prompt-2026-06-02.md)"
```

## Result

verified:

- Cursor recognized verified bounded producer outputs beyond Syft/CycloneDX:
  Docker Compose, Helm, protobuf descriptors, Semgrep local-rule findings,
  Universal Ctags reference-role records, `jdeps` package rows, and bounded
  jscpd report.
- Cursor preserved static Compose/Helm outputs as metadata-visible desired-state
  models, not runtime topology.
- Cursor preserved Ctags output as source-visible reference-role evidence, not
  full def/use or call graph.
- Cursor preserved `jdeps` output as narrow existing-artifact dependency
  evidence, not production JVM dependency closure.

partial:

- Runtime evidence remains limited to spec 073 lifecycle/container/NodeManager
  observations plus failed/skipped Hadoop services.
- C5/C6 evidence is stronger but incomplete.

blocked / not_assessed:

- Spec 074 runtime health summary remains blocked/not_assessed pending explicit
  runtime approval.

cannot_verify:

- Complete Bigtop runtime topology.
- Full Bigtop symbol/reference graph.
- Call graph.
- Human/enterprise code-intelligence parity.

Allowed wording:

> Portolan has verified, bounded producer outputs beyond Syft/CycloneDX for
> Bigtop across deployment models, API/catalog descriptors, Semgrep local
> findings, source-visible reference-role records, narrow compiled-artifact
> dependencies, duplication evidence, and partial runtime-visible lifecycle
> evidence.

Disallowed wording:

> Portolan verifies complete Bigtop runtime topology.

> Portolan has a full Bigtop symbol/reference or call graph.

> Cursor plus Portolan understands Bigtop like a human or enterprise code
> intelligence system.
