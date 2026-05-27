# Producer Attempt Ledger

Date: 2026-05-27

| Producer | Target | Profile | State | Evidence | Reason |
| --- | --- | --- | --- | --- | --- |
| `jscpd` | Portolan repository smoke target | bounded local profile | verified | `/tmp/portolan-039-jscpd/jscpd-report.json`; `/tmp/portolan-039-context/tool-registry.json` | Bounded run produced usable JSON and context preparation surfaced it as metadata-visible evidence. |
| `jscpd` | fixed Bigtop target | bounded local profile | not_assessed | none | This slice did not run bounded jscpd on Bigtop. Prior full Bigtop run remains unproven/failed as recorded in spec 035. |

## Product Claim Impact

- Near-clone evidence can be described only for the Portolan repository smoke
  target and bounded profile.
- Bigtop near-clone duplication remains unproven.
- Broad landscape near-clone claims remain narrowed, not accepted globally.
