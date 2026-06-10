# Implementation Plan: External Tool Evaluation Profiles

**Branch**: `codex/084-external-tool-evaluation-profiles` | **Date**: 2026-06-10

## Summary

Publish dated evaluation profiles and harness recipes for the first-wave OSS
stack. Profiles live under `docs/harness/tool-profiles/`; recipes under
`harness/recipes/`.

## Deliverables

| Artifact | Path |
| --- | --- |
| jscpd profile | `docs/harness/tool-profiles/jscpd.md` |
| Semgrep profile | `docs/harness/tool-profiles/semgrep.md` |
| Syft profile | `docs/harness/tool-profiles/syft-cyclonedx.md` |
| ctags profile | `docs/harness/tool-profiles/universal-ctags.md` |
| UA profile | `docs/harness/tool-profiles/understand-anything.md` |
| CodeGraph profile | `docs/harness/tool-profiles/codegraph.md` |
| ast-index profile | `docs/harness/tool-profiles/ast-index.md` |
| UA fork spike | `docs/research/2026-06-10-understand-anything-fork-spike.md` |
| Recipes | `harness/recipes/*.md` |

## Verification

```bash
test -f docs/harness/tool-profiles/jscpd.md
test -f harness/recipes/duplication-jscpd.md
git diff --check
```
