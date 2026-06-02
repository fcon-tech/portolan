# Cursor Stress Ledger: Spec 070

Date: 2026-06-02
Branch: `codex/070-bigtop-ctags-import-references`
Model: Cursor Agent `composer-2.5`

## Lane Evidence

| Lane | Prompt | Output | Status |
| --- | --- | --- | --- |
| Cursor plus Portolan C6 boundary stress | `stress/cursor-ctags-import-reference-prompt-2026-06-02.md` | `stress/cursor-ctags-import-reference-output-2026-06-02.md` | assessed |

The lane completed with:

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust "$(cat docs/specs/070-bigtop-ctags-import-references/stress/cursor-ctags-import-reference-prompt-2026-06-02.md)"
```

## Result

verified:

- Spec 070 moves C6 beyond definitions-only evidence.
- Universal Ctags import roles are real reference-role producer output for
  bounded Java/Go package imports.
- The new evidence is bounded `source-visible` package import-reference
  evidence for the same 15 selected targets as spec 059.

partial:

- C6 symbol/reference graph is stronger but still partial.

cannot_verify:

- Method/class references.
- Cross-reference resolution from definitions to use sites.
- Call graph.
- C4 runtime topology.
- C9 human/enterprise architecture parity.

Allowed wording:

> For the same 15 selected Bigtop target repositories as spec 059, Universal
> Ctags 6.2.1 produced bounded, source-visible Java/Go package
> import-reference evidence: exit code 0, 873,435 `roles: "imported"` records,
> 59,704 unique importing files, with per-repo and top-package summaries
> recorded.

Disallowed wording:

> Portolan has a full Bigtop symbol/reference graph.

> Portolan has a Bigtop call graph.

> Portolan plus Cursor understands Bigtop like a human architect or enterprise
> code intelligence system.

## Next Evidence

Full C6 requires a reference-capable producer output with method/field/type
references, cross-reference linkage, coverage validation, and ideally a separate
call-capable producer if call graph remains part of the claim.

Cursor did not reproduce the raw 936,748-record output. It reviewed the
recorded producer counts and boundaries from this spec's prompt. Byte-level raw
output verification is provided by the external `sha256.txt`/`sizes.txt`
evidence recorded in `ctags-import-reference-ledger-2026-06-02.md`.
