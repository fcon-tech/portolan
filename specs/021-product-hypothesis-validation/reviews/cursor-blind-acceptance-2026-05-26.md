# Hypothesis Ledger: Cursor Blind Acceptance

Date: 2026-05-26

## Hypothesis

- ID: H5
- Claim: Cursor Agent can use Portolan as an augmentation layer from only
  Portolan path, target root, output directory, and local/no-mutation
  boundaries.
- Bigtop target: `/home/governor/projects/bigtop-landscape`
- Control target: `/home/governor/projects/consensus_tg_bot`
- Acceptance client: Cursor Agent CLI / Composer

## Evidence

- Bigtop ledger:
  `specs/015-blind-agent-acceptance/reviews/cursor-bigtop-blind-run-2026-05-26.md`
- Control ledger:
  `specs/015-blind-agent-acceptance/reviews/cursor-control-blind-run-2026-05-26.md`
- Bigtop artifacts:
  `/tmp/portolan-bigtop-blind-cursor-context/` and
  `/tmp/portolan-bigtop-blind-cursor-run/`
- Control artifacts:
  `/tmp/portolan-control-blind-cursor-run/`

## Result

Cursor Agent completed the protocol shape for both targets and produced
Portolan artifacts without a prepared `selection.json`. Both runs are
classified `degraded`, not `passed`.

## Classification

| Claim | Classification | Notes |
| --- | --- | --- |
| Cursor Agent can discover and run the generic Portolan workflow without a prepared selection path. | `verified` for these two runs | Both runs produced context/map artifacts from `--root`. |
| Cursor Agent produces CTO-safe answers from artifacts rather than unsupported target knowledge. | `verified` for these two runs | Reports preserved `unknown` and `not_assessed`. |
| The current product is smooth enough for first-run CTO use. | `failed` | Harness blocked direct `go`; no installed binary; many CTO surfaces remained `not_assessed`. |
| Bigtop external completeness is known. | `unknown` | No manifest-backed comparison was used in blind mode. |
| OSS assembly is sufficient without running or importing OSS tool outputs. | `failed` | Both context packs had empty `tool-registry.json`. |

## Product Gaps Proven

| Gap ID | Generic gap | Evidence |
| --- | --- | --- |
| GAP-HARNESS-GO | Cursor may block direct `go`/`go run`; source-checkout execution is brittle. | Both ledgers. |
| GAP-NO-BINARY | First-run workflow needs a packaged `portolan` binary or clear install path. | Both ledgers. |
| GAP-OSS-EMPTY | OSS assembly needs execution/import guidance, not just candidate detection. | Both tool registries empty. |
| GAP-REL-NONGO | Non-Go relationship detection is needed for CTO relationship questions. | Bigtop and control findings. |
| GAP-DUP-CFG-DEBT | Duplication, configuration, and debt detectors are still missing. | `run.json` skipped surfaces. |
| GAP-GRAPH-SCALE | Large graph artifacts need an agent-scale summary/index. | Bigtop graph was about 124 MB. |
| GAP-GRAPH-TYPE | File inventory nodes need useful surface classification. | Control graph had 760 unknown file nodes. |
| GAP-DUP-FINDINGS | Placeholder findings need deduplication. | Control map duplicated relationship placeholders. |

