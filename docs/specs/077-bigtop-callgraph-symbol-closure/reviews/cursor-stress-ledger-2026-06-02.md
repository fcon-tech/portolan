# Cursor Stress Ledger

Spec: `docs/specs/077-bigtop-callgraph-symbol-closure/`

Date: 2026-06-02

Command:

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust "$(cat docs/specs/077-bigtop-callgraph-symbol-closure/stress/cursor-callgraph-symbol-prompt-2026-06-02.md)"
```

Output:

- `docs/specs/077-bigtop-callgraph-symbol-closure/stress/cursor-callgraph-symbol-output-2026-06-02.md`

## Assessment

verified:

- Cursor preserved full Bigtop symbol/reference graph as `cannot_verify`.
- Cursor preserved Bigtop call graph as `cannot_verify`.
- Cursor rejected stacking Ctags, gopls, jdeps, Maven, and Java into enterprise
  code-intelligence parity.
- Cursor identified the verified 077 evidence as producer absence, exact PATH
  probe, adjacent tool versions, decision record, and claim boundary
  reaffirmation.

partial:

- Existing Ctags/gopls/jdeps outputs remain partial/bounded evidence only.

not_assessed:

- Spec 074 runtime health execution.
- Spec 076 Cursor enterprise parity.
- Actual graph output from unavailable tools.

## Accepted Findings

No corrective findings. The stress output is consistent with the 077 decision
record and Portolan evidence-state rules.
