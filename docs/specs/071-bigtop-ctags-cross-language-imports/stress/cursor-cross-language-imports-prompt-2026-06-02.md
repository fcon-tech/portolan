# Cursor Claim-Boundary Prompt: Cross-Language Ctags References

Run metadata:

- model: Cursor Agent `composer-2.5`
- branch: `codex/071-bigtop-ctags-cross-language-imports`
- execution_mode: `cursor-agent --print --mode ask --trust`

Evaluate whether spec 071 changes the C6 and C9 assessment for Apache Bigtop
architecture understanding.

Do not browse the internet. Do not start services. Do not contact Kubernetes.
Do not treat header/import/script reference roles as method/class references,
cross-reference resolution, or call graph.

## Prior State

- Spec 069: C6 partial; full symbol/reference graph and call graph
  `cannot_verify`.
- Spec 070: Universal Ctags produced 873,435 Java/Go package import-reference
  records across 59,704 files. C6 stronger than definitions-only but still
  partial. Full symbol/reference graph, call graph, runtime topology, and
  enterprise parity remained `cannot_verify`.

## New Spec 071 Evidence

Universal Ctags 6.2.1 was run over the same 15 selected Bigtop target
repositories used by specs 059 and 070.

Producer command:

```bash
ctags -R --output-format=json --fields=+Klnr --extras=+r \
  --languages=C,C++,Python,Sh \
  -f "$OUT/bigtop-selected-cross-language-imports.jsonl" \
  $(cat "$OUT/selected-target-paths.txt")
```

Producer result:

- Exit code: `0`.
- Total JSON records: 347,610.
- Tag records: 347,522.
- Reference-role records: 147,472.
- Unique reference files: 8,432.
- Language counts:
  - C: 4,823.
  - C++: 45,983.
  - Python: 294,256.
  - Sh: 2,460.
- Key reference roles:
  - `imported`: 87,115.
  - `namespace`: 51,707.
  - `indirectlyImported`: 3,518.
  - `system`: 2,779.
  - `local`: 1,764.
  - `loaded`: 153.

Top role/language/kind combinations:

```text
74674 Python unknown imported
51707 Python module namespace
12441 Python module imported
1976 C++ header system
1771 Python unknown indirectlyImported
1747 Python module indirectlyImported
1183 C++ header local
803 C header system
581 C header local
153 Sh script loaded
```

Boundary:

- These are source-visible ctags reference roles.
- They extend spec 070 beyond Java/Go package imports.
- They are not method/class references.
- They are not cross-reference resolution.
- They are not call graph.
- No Bigtop service was started.
- No Bigtop repository was built.
- No new indexer was installed.

## Required Output

Return:

1. Does this improve C6 breadth beyond spec 070?
2. Is full C6 now verified or still partial?
3. What exact claim is allowed?
4. What claims remain disallowed?
5. Does this change C4 runtime topology or C9 enterprise parity?
6. What next evidence is required to verify full C6?

Be strict. Do not overclaim.
