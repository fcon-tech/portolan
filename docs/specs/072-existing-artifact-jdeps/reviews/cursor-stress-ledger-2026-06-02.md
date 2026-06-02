# Cursor Stress Ledger: Spec 072

Date: 2026-06-02
Branch: `codex/072-existing-artifact-jdeps`
Model: Cursor Agent `composer-2.5`

## Lane Evidence

| Lane | Prompt | Output | Status |
| --- | --- | --- | --- |
| Cursor plus Portolan existing-artifact `jdeps` boundary stress | `stress/cursor-existing-artifact-jdeps-prompt-2026-06-02.md` | `stress/cursor-existing-artifact-jdeps-output-2026-06-02.md` | assessed |

The lane completed with:

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust "$(cat docs/specs/072-existing-artifact-jdeps/stress/cursor-existing-artifact-jdeps-prompt-2026-06-02.md)"
```

## Result

verified:

- Spec 072 proves bounded compiled-artifact JVM package/module dependency
  evidence for 9 existing artifacts under selected Bigtop roots.
- The assessed `jdeps` run exited `0` for all 9 artifacts, produced 289 package
  dependency rows, and recorded 16 unresolved `not found` rows.
- Cursor preserved the evidence boundary and did not upgrade the broad
  architecture claim.

partial:

- C6 is stronger only for bounded existing-artifact JVM dependency evidence.
- Artifact coverage remains narrow: 9 artifacts in 3 of 15 selected
  repositories, mostly test/resource jars and tiny UDF fixtures.

cannot_verify:

- Full source-level symbol/reference graph.
- Method/class/type source references.
- Cross-reference resolution.
- Call graph.
- C4 runtime topology.
- C9 human/enterprise architecture parity.

Allowed wording:

> `jdeps` 26.0.1 produced bounded package/module dependency evidence for 9
> existing JVM artifacts already present under selected Bigtop target roots:
> exit 0 for all artifacts, 289 package dependency rows, and 16 unresolved
> `not found` rows. The artifact set is dominated by bundled third-party
> test/resource jars and tiny UDF fixtures, not Bigtop production build output.

Disallowed wording:

> Portolan has a full Bigtop JVM dependency graph.

> Portolan has a Bigtop source symbol/reference graph.

> Portolan has a Bigtop call graph.

> Portolan verifies Bigtop runtime topology.

> Portolan plus Cursor understands Bigtop like a human architect or enterprise
> code intelligence system.

## Next Evidence

Full C6 still requires reference-capable source indexing or representative built
production artifacts with validated dependency/reference coverage. C9 also
requires verified runtime topology.
