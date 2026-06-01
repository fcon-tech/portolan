# Cursor Symbol Definitions Stress: Spec 059

Date: 2026-06-02
Model: Cursor Agent `composer-2.5`

## Command

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust \
  --workspace /home/fall_out_bug/projects/bigtop-landscape \
  "$(cat docs/specs/059-bigtop-symbol-reference-producer-acquisition/stress/cursor-plus-portolan-symbol-definitions-prompt-2026-06-02.md)"
```

Result: `verified`; command completed before the 10-minute timeout.

Prompt:

- `stress/cursor-plus-portolan-symbol-definitions-prompt-2026-06-02.md`

Output:

- `stress/cursor-plus-portolan-symbol-definitions-output-2026-06-02.md`

## Assessment

Cursor plus Portolan correctly updated C6 as:

- `partial`
- broad selected-scope symbol-definition catalog
- not full symbol/reference graph
- not call-site/use-site/cross-repo reference evidence

Cursor preserved:

- runtime topology: `not_assessed`
- enterprise code-intelligence parity: `not_assessed`

## Accepted Claim

Portolan now has broad selected-scope Bigtop symbol definition evidence from
Universal Ctags:

- 15 selected targets from `selection.json`
- 5,390,732 JSONL tags
- 93,380 unique files
- 0 bad JSON lines

## Forbidden Claim

Do not claim:

- full symbol/reference graph;
- call graph;
- cross-repo reference graph;
- runtime topology;
- enterprise code-intelligence parity.
