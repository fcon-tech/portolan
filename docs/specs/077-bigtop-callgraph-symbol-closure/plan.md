# Implementation Plan: Bigtop Callgraph And Symbol Closure

**Branch**: `codex/077-bigtop-callgraph-symbol-closure`

**Spec**: `docs/specs/077-bigtop-callgraph-symbol-closure/spec.md`

## Summary

Attempt to close the full Bigtop symbol/reference/call graph gap left by specs
064, 070, 071, and 075. The slice starts with producer selection and safe local
probes. It may end in reviewed `cannot_verify` if mature producers require
installation, network access, target mutation, or unavailable build artifacts.

## Decision Gate

- **Simpler/Faster**: Jump directly to spec 076 Cursor enterprise parity.
  Rejected because C6 full symbol/reference graph and call graph remain
  `cannot_verify`; a parity run would mostly restate the known gap.
- **Blocking Edge Cases**: Java-heavy Bigtop targets often need build-aware
  indexes for resolved def/use and call edges. CodeQL-style databases usually
  require a build for compiled languages. JDT LS needs a workspace/import model.
  SCIP/LSIF requires language-specific indexers. srcML is scalable and
  source-oriented but is not by itself a resolved call graph. The slice must not
  install tools, fetch indexes, mutate target repositories, or infer full graph
  evidence from parser/reference-role output.
- **Existing Open Source**: Evaluate mature local-first producers before any
  Portolan implementation: SCIP/LSIF-style indexes, CodeQL database exports,
  Eclipse JDT Language Server/JDT model outputs, srcML, and any already
  installed build-tool exports. Do not build a native graph extractor in this
  slice.

## Candidate Producer Notes

- SCIP/LSIF: fit for code-intelligence style symbol occurrence indexes when a
  language-specific indexer exists locally; risk is tool availability and
  per-language setup.
- CodeQL CLI: strong graph/query substrate, but compiled languages usually need
  an available build command; a no-build database may be insufficient for
  Bigtop Java production graph claims.
- Eclipse JDT LS/JDT: strong Java semantic model candidate, but requires a
  local workspace and project import; output extraction may require an adapter
  or LSP client.
- srcML: mature multi-language source-to-XML producer; useful for structural
  source evidence, but not sufficient alone for resolved def/use or call graph.
- Universal Ctags/gopls/jdeps: already verified as bounded evidence in prior
  specs; useful baselines but not full graph closure.

## Scope

In scope:

- Reconstruct prior full graph blockers from specs 064, 070, 071, and 075.
- Probe installed producer availability without installing tools or contacting
  external services.
- Decide whether any available producer can safely emit resolved graph evidence
  for a bounded Bigtop scope.
- If available, run the smallest read-only bounded producer command and ledger
  command, version, input roots, output path, row counts, evidence state, and
  limitations.
- If unavailable, record reviewed `cannot_verify` with exact blocker taxonomy
  and next approved action.
- Run Cursor stress and independent non-GPT review before any C6/callgraph
  claim upgrade.

Out of scope:

- Installing indexers or build systems.
- Starting services or runtime topology capture.
- Mutating target repositories.
- Network fetches or credential use.
- Native Portolan graph extractor implementation.
- Cursor enterprise parity claim promotion; deferred to spec 076.

## Evidence Inputs

- `docs/specs/064-bigtop-def-ref-producer-probe/reviews/def-ref-probe-ledger-2026-06-02.md`
- `docs/specs/064-bigtop-def-ref-producer-probe/reviews/pr42-merge-closeout-2026-06-02.md`
- `docs/specs/070-bigtop-ctags-import-references/reviews/ctags-import-reference-ledger-2026-06-02.md`
- `docs/specs/071-bigtop-ctags-cross-language-imports/reviews/ctags-cross-language-ledger-2026-06-02.md`
- `docs/specs/075-bigtop-producer-output-coverage-closure/reviews/producer-coverage-matrix-2026-06-02.md`
- `docs/specs/075-bigtop-producer-output-coverage-closure/reviews/merge-closeout-2026-06-02.md`

## Output Artifacts

- `reviews/requirements-product-vision-drift-2026-06-02.md`
- `reviews/graph-producer-decision-record-2026-06-02.md`
- `reviews/producer-availability-ledger-2026-06-02.md`
- `stress/cursor-callgraph-symbol-prompt-2026-06-02.md`
- `stress/cursor-callgraph-symbol-output-2026-06-02.md`
- `reviews/cursor-stress-ledger-2026-06-02.md`
- `reviews/review-disposition-2026-06-02.md`
- `reviews/pr-readiness-closeout-2026-06-02.md`

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

For docs-only or decision-record-only closure, no additional Go tests are
required beyond baseline. If a producer command runs, the ledger must include
its exact command and output validation.
