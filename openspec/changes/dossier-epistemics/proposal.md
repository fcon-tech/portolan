## Why

The dossier lists facts but not how each is known — the Governor must
infer epistemic weight from scattered trust labels. The locked vocabulary
plus receipt anchors already encode the ladder (claimed → declared →
source-verified → runtime-observed); the dossier should surface it as a
ledger, and the panel deserves room to show it.

## What Changes

- The briefing panel widens (400 → 520px).
- Every vessel dossier gains an **epistemic ledger** above the sections:
  four counted lamps with a one-line mapping footnote —
  **OBSERVED** (runtime receipts: behavior or receipt anchors on its
  entries), **VERIFIED** (source-read: `measured` entries), **DECLARED**
  (`charted`: manifests/BOM/packaging), **CLAIMED** (`reported` +
  `doubtful`), each lamp naming the entries it counts.
- Fairway rows gain their sounded verdict when the stored note records it
  ("sounded: confirmed"), and any entry backed wholly by a weaker tier is
  named in its lamp, so nothing rides on unverified claims silently.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `chart-room`: adds requirements (ADDED deltas): the ledger's lamps,
  their honest derivations from embedded fields only, per-item trust
  badges in lists, and the wider panel.

## Impact

- Code: `template.html` CSS + `renderDossier`. No data changes;
  determinism unaffected (transient UI), plate untouched.
