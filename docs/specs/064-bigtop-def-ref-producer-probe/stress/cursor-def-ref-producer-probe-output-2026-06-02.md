# Cursor Stress Output: Def/Ref Producer Probe

Date: 2026-06-02
Model: `composer-2.5`
Mode: `agent --print --mode ask --model composer-2.5 --trust`

## Result

cannot_verify:

- Full Bigtop symbol/reference graph.
- Call graph.
- Enterprise code-intelligence parity.

verified:

- Def/ref blocker evidence is supported by missing full def/ref indexer tools
  and missing compiled project artifacts.
- The only jar in selected scope is a test resource jar and `jdeps` on it does
  not provide project-level graph evidence.

partial / adjacent only:

- `ctags`: definitions inventory, not references.
- `gopls`: Go-only and bounded.
- `javap` / `jdeps`: require compiled classes/jars.
- `mvn`: build tool, not read-only def/ref exporter.

blocked:

- Installing or enabling a full def/ref indexer.
- Building selected Bigtop repos to produce compiled artifacts.

## Safe Claim

Spec 064 verifies why full def/ref remains `cannot_verify`: full indexer tools
are absent and selected Java-heavy repos do not have compiled artifacts. It does
not verify a symbol/reference graph.
