# Parity Stress Ledger: Spec 058

Date: 2026-06-02
Model: Cursor Agent `composer-2.5`

## Lanes

| Lane | Prompt | Output | Status |
| --- | --- | --- | --- |
| Cursor-only | `stress/cursor-only-parity-rubric-prompt-2026-06-02.md` | `stress/cursor-only-parity-rubric-output-2026-06-02.md` | assessed |
| Cursor-plus-Portolan | `stress/cursor-plus-portolan-parity-rubric-prompt-2026-06-02.md` | `stress/cursor-plus-portolan-parity-rubric-output-2026-06-02.md` | assessed |

Both lanes completed with `cursor-agent --print --mode ask --model composer-2.5
--trust --workspace /home/fall_out_bug/projects/bigtop-landscape` before the
10-minute timeout.

## Scoring

| Criterion | Cursor-only status | Cursor-plus-Portolan status | Assessment |
| --- | --- | --- | --- |
| C1 Landscape scope and role map | partial | partial | Portolan improves explicit scope/gap framing; selected scope still has 15 targets while checkout contains more repos. |
| C2 Static dependency and relationship graph | partial | partial | Portolan adds queryable graph/gap discipline, but broad JVM/Scala/Maven relationship coverage remains incomplete. |
| C3 Deployment model | verified | partial | Cursor-only called static deployment model verified; Portolan correctly narrows this to partial metadata-visible evidence because static deployment files are not runtime. |
| C4 Runtime topology | cannot_verify | not_assessed | Both lanes fail the runtime proof. Portolan status is more precise: no runtime-visible Bigtop observation export exists. |
| C5 API/catalog/model surfaces | partial | partial | Portolan scopes evidence to bounded Alluxio protobuf descriptor and known catalog gaps. |
| C6 Symbol/reference graph | cannot_verify | partial | Cursor-plus-Portolan uses selected-file `gopls` symbol listing as partial evidence but still says full def/ref graph is missing. This is not full symbol/reference verification. |
| C7 Evidence-state discipline | partial | partial | Portolan improves discipline, but 057/058 outputs are not all canonical producer-run records yet. |
| C8 Cursor augmentation value | partial | partial | Improvement is evidence discipline and gap attribution, not completeness. |
| C9 Enterprise parity threshold | cannot_verify | not_assessed | Both lanes reject enterprise parity. Portolan gives the stronger reason: C4 and full C6 are missing. |

## Accepted Result

Verified scoped:

- Cursor plus Portolan improves bounded architecture answers by preserving
  evidence-state boundaries and gap attribution.
- Cursor plus Portolan prevents static deployment/model/API evidence from being
  promoted to runtime topology or enterprise parity.
- Stress scope is bounded to rubric scoring consistency and gap attribution; it
  does not verify broad Bigtop architecture-understanding coverage.

Not verified:

- Bigtop runtime topology.
- Full Bigtop symbol/reference graph.
- Human/enterprise code-intelligence parity for the declared Bigtop scope.

## Evidence Correction

During the first runtime probe snapshot, the selection count was queried through
`.repositories | length`; the actual selection schema uses `.targets`. The
external snapshot was corrected to record:

```text
runtime        null
tool_outputs   null
target_count   15
repositories_key       null
```

The correction does not change the runtime conclusion: no selected runtime
export exists.
