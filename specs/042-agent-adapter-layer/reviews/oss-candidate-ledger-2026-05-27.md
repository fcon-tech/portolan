# OSS Candidate Ledger - 2026-05-27

Mode: REVIEW

## Source Verification

Reviewed from official upstream sources and shallow local snapshots under
`/tmp/portolan-042-research/`:

| Candidate | Upstream | Snapshot | License evidence |
| --- | --- | --- | --- |
| Graphify | https://github.com/safishamsi/graphify | `740382af511b53c0c59647329433e16e2ad0f82d` | `LICENSE` says MIT. |
| SCIP | https://github.com/scip-code/scip | `99236e35450ccd8b87fe58c38d31fd499d0ffdfa` | `LICENSE` says Apache-2.0. |
| Serena | https://github.com/oraios/serena | `7bf30080f6aa8fc1f983e1d72bc91dd790f28d29` | `LICENSE` says MIT. |
| Repomix | https://github.com/yamadashy/repomix | `6d7800eada2e5a2e4d2ef24dc4c09a18348c5769` | `LICENSE` says MIT. |

Legal compatibility is `needs_review`; this ledger is engineering triage, not
legal approval.

## Candidate Decisions

| Candidate | License | Maintenance | Local execution | Privacy | Format stability | Adapter cost | Evidence mapping | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Graphify | `needs_review`; MIT observed | `accepted`; active repo and worked examples observed | `narrowed`; code extraction can be local, docs/semantic extraction may use model APIs | `narrowed`; graph output can contain labels, paths, rationale, and possibly LLM-derived facts | `narrowed`; `graph.json` is NetworkX node-link style with confidence tags, but schema is not a Portolan contract | medium | `EXTRACTED -> metadata-visible`, `INFERRED -> claim-only`, `AMBIGUOUS -> cannot_verify` | accepted for adapter contract validation/profile only; full import deferred |
| SCIP | `needs_review`; Apache-2.0 observed | `accepted`; language-agnostic code intelligence protocol with indexer ecosystem | `accepted`; local index files can be imported without running language servers | `accepted`; symbol/range metadata is lower-risk than packed source, but paths may be sensitive | `accepted`; protocol/schema centered | medium | symbol identity/ranges are metadata-visible until Portolan inspects source | accepted as symbol-index profile input, not native dependency in this slice |
| Serena | `needs_review`; MIT observed | `accepted`; active LSP/MCP toolkit observed | `profile-gated`; normal use starts MCP/LSP tooling, but Portolan should import exported/indexed facts only | `narrowed`; editing/refactor/debug tools and memories are outside Portolan boundary | `not_assessed`; no stable Portolan export contract verified | high for direct integration, low as profile reference | semantic symbol outputs are metadata-visible; edit/refactor claims are not_assessed | accepted only as a SCIP/LSP-style profile reference |
| Repomix | `needs_review`; MIT observed | `accepted`; active packer with CLI, JSON/XML/Markdown outputs, token and security features | `narrowed`; local packing fits, remote/MCP modes are out of default boundary | `blocked for raw committed fixtures`; outputs commonly contain source snippets and may include secrets without redaction | `narrowed`; JSON output is parseable but packed text is context, not evidence graph | low for inventory/token profile, high for safe content ingestion | file inventory/token data can be metadata-visible; packed source content is context and requires redaction | accepted as context-pack profile only; no packed-source fixture committed |

## Accepted Constraints

- No new runtime dependency is added in spec 042.
- Portolan validates local adapter contracts; it does not install, invoke, or start Graphify, SCIP indexers, Serena MCP/LSP servers, or Repomix.
- Producer facts remain weaker than direct Portolan source/runtime inspection.
- Unknown Graphify confidence labels or missing confidence are treated as `cannot_verify` in the Graphify profile until a future profile revision defines them.

## Not Assessed

- Full legal review.
- Security audit of upstream tools.
- Running upstream tools against a real target.
- Full Graphify `graph.json` normalization.
- SCIP protobuf parsing or Serena MCP/LSP integration.
- Repomix packed-output parsing or redaction enforcement.
