# Tasks: CTO Demo & Eval (108)

- [x] Initial bounded Bigtop scan + eval artifact + run-query-eval CTO questions
- [x] Agent analysis pass + claims import (incl. rejected case)
- [x] demo-runbook CTO scenario + product-claims update
- [x] PR #72 follow-up: supersede the 10-repo experiment route with full-corpus
  Bigtop acceptance and repository-count consistency checks

Historical review evidence under `reviews/` records the original bounded
10-repository run, C1-C5 Lane B results, claims pass 6 accepted / 1 rejected
with reason, demo bar manual pass, and known limits. Do not reuse that bounded
run as current CTO acceptance. Current acceptance is the full Bigtop corpus
route in `docs/demo-runbook.md` plus `scripts/harness-bigtop-acceptance.sh`.
