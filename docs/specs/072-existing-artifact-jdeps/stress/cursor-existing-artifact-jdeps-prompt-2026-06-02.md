# Cursor Stress Prompt: Existing Artifact Jdeps Boundary

You are reviewing a Portolan evidence slice in the local repo.

Files:

- `docs/specs/072-existing-artifact-jdeps/spec.md`
- `docs/specs/072-existing-artifact-jdeps/plan.md`
- `docs/specs/072-existing-artifact-jdeps/tasks.md`
- `docs/specs/072-existing-artifact-jdeps/reviews/jdeps-existing-artifact-ledger-2026-06-02.md`
- `docs/specs/069-bigtop-architecture-synthesis/reviews/architecture-synthesis-ledger-2026-06-02.md`
- `docs/specs/071-bigtop-ctags-cross-language-imports/reviews/pr49-merge-closeout-2026-06-02.md`

External evidence root:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-072-existing-artifact-jdeps/tool-outputs/
```

Question:

After this slice, can Cursor plus Portolan claim that it understands Apache
Bigtop architecture like a human architect or enterprise code-intelligence
system? Can it claim verified runtime topology or full C6 symbol/reference
graph?

Use these evidence states:

- `verified`: directly checked by command, tool output, or committed ledger.
- `partial`: real evidence exists but does not cover the whole claim.
- `cannot_verify`: required evidence is absent or blocked.
- `not_assessed`: not checked.

Expected discipline:

- Treat `jdeps` output as compiled-artifact package/module dependency evidence
  only.
- Do not promote test/resource jars or tiny UDF artifacts to representative
  full Bigtop architecture coverage.
- Do not promote `jdeps` package rows to source-level references, call graph, or
  runtime topology.

Return:

1. What this slice proves.
2. What remains partial.
3. What remains `cannot_verify`.
4. Allowed and disallowed claim wording.
