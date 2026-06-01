# Post-Fix Review Packet: 052 Dependency And Symbol Evidence Import

Date: 2026-06-01

Branch: `codex/052-dependency-symbol-evidence-import`

Scope: focused re-review of accepted post-slice findings.

## Fixes Applied After Post-Slice Review

- Added selected-output symbol-index bounds:
  - maximum selected symbol-index documents: 5000
  - maximum selected symbol records: 50000
  - zero documents => `cannot_verify`
  - count-limit excess => `cannot_verify`
  - no relationship edges are emitted after a selected symbol-index output
    fails validation
- Added context summary bounds:
  - zero documents => `cannot_verify`
  - document/symbol count-limit excess => `cannot_verify`
- Preserved backward compatibility for the previously exposed `code-index`
  context gap:
  - `symbol-index` is the new primary family
  - `gap-code-index-not-assessed` remains as a legacy alias when symbol-index
    evidence is absent
  - `code-index` filenames are detected as symbol-index producer evidence
- Strengthened answer-contract language:
  - local dependency/symbol producer records do not mean Portolan has native
    PHP/JVM/Scala or other language semantics
- Bounded selected symbol metadata strings before graph labeling/source
  attribution. The slice still does not add public export or redaction behavior.
- Added tests for:
  - selected dependency/CycloneDX relationship evidence
  - malformed and oversized dependency output
  - selected mixed PHP/JVM-style symbol-index evidence
  - empty and count-exceeding symbol-index output
  - absent dependency/symbol producer gaps
  - context `symbol-index` registry/evidence-index/gap behavior

## Verification After Fixes

```text
go test -count=1 ./internal/selection ./internal/maprun ./internal/app -run 'TestNormalize|TestRelationshipProducerGapFindings|TestValidate|TestRunContextPrepare(SummarizesSymbolIndexToolOutput|WritesCursorPack)'
```

Passed.

## Re-Review Questions

1. Do these fixes adequately resolve the blocking symbol-index bounding issue?
2. Is the `code-index` legacy gap alias a sufficient compatibility mitigation?
3. Are remaining privacy/export concerns acceptable as `not_assessed` because
   this slice is local-only and adds no export behavior?
4. Is this good enough to proceed to full verification and Cursor stress
   testing?

Return concise findings with severity `critical`, `major`, or `minor`, plus a
verdict of `pass`, `pass_with_changes`, or `block`. Use only this packet.
