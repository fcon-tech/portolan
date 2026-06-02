# Cursor Stress Ledger: Spec 071

Date: 2026-06-02
Branch: `codex/071-bigtop-ctags-cross-language-imports`
Model: Cursor Agent `composer-2.5`

## Lane Evidence

| Lane | Prompt | Output | Status |
| --- | --- | --- | --- |
| Cursor plus Portolan cross-language C6 boundary stress | `stress/cursor-cross-language-imports-prompt-2026-06-02.md` | `stress/cursor-cross-language-imports-output-2026-06-02.md` | assessed |

The lane completed with:

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust "$(cat docs/specs/071-bigtop-ctags-cross-language-imports/stress/cursor-cross-language-imports-prompt-2026-06-02.md)"
```

## Result

verified:

- Spec 071 improves C6 breadth beyond spec 070 by adding C/C++/Python/Sh
  reference roles.
- The evidence is bounded `source-visible` cross-language import/header/script
  reference-role output for the same 15 selected targets as specs 059 and 070.

partial:

- C6 symbol/reference graph is stronger but still partial.

cannot_verify:

- Method/class/type reference edges.
- Cross-reference resolution from definitions to use sites.
- Call graph.
- C4 runtime topology.
- C9 human/enterprise architecture parity.

Allowed wording:

> For the same 15 selected Bigtop target repositories as specs 059/070,
> Universal Ctags 6.2.1 produced bounded source-visible cross-language
> reference-role evidence for C/C++/Python/Sh: exit 0, 147,472 reference-role
> records, and 8,432 unique reference files.

Disallowed wording:

> Portolan has a full Bigtop symbol/reference graph.

> Portolan has a Bigtop call graph.

> Portolan plus Cursor understands Bigtop like a human architect or enterprise
> code intelligence system.

## Next Evidence

Full C6 still requires symbol-level references, cross-reference linkage,
coverage validation, and a call-capable producer if call graph remains part of
the claim. C9 also requires verified runtime topology.
