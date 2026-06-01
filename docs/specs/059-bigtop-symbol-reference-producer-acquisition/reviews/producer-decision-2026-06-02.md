# Producer Decision: Spec 059 Symbol/Reference Acquisition

Date: 2026-06-02
Target root: `/home/fall_out_bug/projects/bigtop-landscape`

## Decision

Select Universal Ctags as the first acquisition attempt for broad local Bigtop
symbol evidence.

## Options

| Option | Fit | Maturity | License | Local execution | Privacy posture | Target mutation risk | Install cost | Output semantics | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Universal Ctags | Broad multi-language definitions index across JVM, Go, Python, shell, config-adjacent files | Mature maintained ctags implementation | GPL-2.0-or-later via Homebrew metadata | Local CLI | Reads local files only; output can be written under `.portolan/stress` | Low; no target repo writes required when output path is outside repos | Low; Homebrew formula available as user-local install, stable `6.2.1` | Definitions/tags, not references | selected |
| Exuberant Ctags | Broad definitions, older implementation | Legacy | GPL-family via Ubuntu package metadata | Local CLI | Reads local files only | Low | Medium; apt package available but system install likely requires root and older version | Definitions/tags, not references | rejected in favor of maintained Universal Ctags |
| SCIP/LSIF family | Better definition/reference semantics when language indexers exist | Mature concept, but language-specific acquisition | varies | Local if indexers installed | Depends on indexer; source stays local if configured correctly | Low to medium | Higher; no `scip`, `lsif-java`, `lsif-go`, or `src-cli` currently installed | Potential definitions plus references | deferred |
| `gopls` | Strong for Go files | Mature | BSD-style Go ecosystem | Local CLI | Reads local Go module files | Low | Already installed | Symbols for selected files; references require module-specific commands and Go-only scope | already partial; not enough for Bigtop-wide evidence |
| Java/JVM build analyzers (`javap`, `mvn`, `jdeps`) | Useful for dependency/class surfaces | Mature | varies | Local CLI | Local if dependencies are already present | Build commands may write target dirs/caches | Medium/high for large Bigtop repos | Dependency/classes, not full source references | deferred |

## Why Now

Spec 058 proved that full symbol/reference evidence is missing. Universal Ctags
is the lowest-risk mature local producer available through a user-local package
manager and can produce a broad definitions index without mutating target repos.

## Reversibility

High. The producer is external, acquired through Homebrew, and outputs are kept
under the Bigtop `.portolan/stress` directory. Portolan code and target repos are
not changed by the producer run.

## Risk If Wrong

- Ctags may miss generated or language-specific semantics.
- Definitions-only output may be mistaken for reference coverage.
- Very large repos may produce noisy output or take too long.

Mitigation: label evidence as `metadata-visible` symbol definitions only. Do not
claim full symbol/reference graph unless a reference-bearing producer is added.

License note: GPL applies to the Universal Ctags binary. This slice records
summary evidence from running the tool and does not link or vendor Universal
Ctags into Portolan.

Output hygiene: the raw JSONL output is large and may contain source-adjacent
patterns, paths, and symbol names. It must remain in the local external stress
root and must not be committed.

## Confidence

Medium. Universal Ctags is mature and low-risk for definitions, but it does not
solve full def/ref graph coverage.
