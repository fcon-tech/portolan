# Implementation Plan: Bigtop Runtime, Symbol, And Parity Proof

**Branch**: `codex/058-bigtop-runtime-symbol-parity-proof` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

## Summary

Reconstruct the remaining evidence gaps after PR #35 and attack them directly:
runtime-visible topology, full symbol/reference producer output, and a concrete
Cursor plus Portolan parity rubric. The slice should produce stronger evidence
when safe local producers exist and otherwise preserve `not_assessed` or
`cannot_verify` states with precise reasons.

## Technical Context

Known state from PR #35:

- Runtime topology: `not_assessed`; no selected Bigtop runtime observation
  export exists.
- Full symbol/reference graph: `not_assessed`; selected-file `gopls symbols`
  output is partial and does not prove references or cross-repo edges.
- Enterprise code-intelligence parity: `not_assessed`; prior slices improved
  evidence discipline but did not define or meet a parity threshold.

Potential safe local probes:

- Inspect existing Bigtop landscape `.portolan` outputs and selection metadata
  for runtime exports.
- Inspect installed local symbol/reference producers and target repo language
  surfaces.
- Use existing producer outputs from specs 054-057 as context for a parity
  rubric, not as proof of unsupported criteria.

## Decision Gate

- Simpler/Faster: first reconstruct existing local evidence and approved exports
  before generating new outputs.
- Blocking Edge Cases: runtime topology requires live/runtime-visible evidence;
  static deployment models are insufficient. Full symbol/reference requires
  more than file-symbol lists. Enterprise parity is undefined until a rubric
  names capabilities and evidence thresholds.
- Existing Open Source: prefer existing local producers and exported tool
  formats. Do not implement Portolan-owned runtime or symbol scanners in this
  slice.

## Verification

Run:

```bash
go test -count=1 ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

Also run targeted evidence checks for any runtime or symbol producer outputs
that are acquired. Record all stress and review evidence under
`docs/specs/058-bigtop-runtime-symbol-parity-proof/reviews/`.
