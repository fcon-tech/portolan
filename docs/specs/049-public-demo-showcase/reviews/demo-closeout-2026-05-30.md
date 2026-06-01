# Demo Closeout - 2026-05-30

## Implementation State

State: implemented locally.

Implemented:

- public Apache Bigtop runbook in `docs/demo.md`;
- top-level redaction policy in `docs/test-corpora/apache-bigtop/examples/README.md`;
- redacted Bigtop excerpts under `docs/test-corpora/apache-bigtop/examples/`;
- README link to the public demo route;
- source/license, smoke, claim-scan, privacy/freshness, and story-review
  artifacts under this spec's `reviews/` directory.

## Verification

| Check | State | Evidence |
| --- | --- | --- |
| Apache Bigtop cold-start primary setup smoke | verified | `git clone --depth 1 https://github.com/apache/bigtop.git apache-bigtop-repo` passed in 0:04.01; context passed in 0.07s; map passed in 0.40s; bounded query passed. |
| Apache Bigtop larger existing-landscape smoke | verified | Context passed in 0.08s; map passed in 2:25.74; bounded query passed; 18 source-visible repositories, 172243 nodes, 148714 edges, 555 findings, and weak states preserved. |
| `go test -count=1 ./...` | verified | Passed. |
| `jq empty .specify/feature.json schema/*.json docs/test-corpora/apache-bigtop/examples/*.json` | verified | Passed. |
| `git diff --check` | verified | Passed. |
| Product-claim drift scan | verified | `docs/demo.md` stays within `docs/product-claims.md`; no accepted drift findings. |
| Privacy/freshness scan | verified | No private absolute paths in public excerpts; JSON excerpts parse; weak states remain visible. |

## Not Assessed

- Full Bigtop component-repository cold clone.
- Full generated Bigtop output publication.
- Screenshots or terminal recordings.
- GitHub PR state and checks before PR creation.
- Merge approval.

## Stop Condition

Proceed to PR creation and PR-level review. Do not merge without explicit user
approval.
