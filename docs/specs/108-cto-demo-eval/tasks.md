# Tasks: CTO Demo & Eval (108)

- [x] bigtop-10 scan + eval artifact + run-query-eval CTO questions
- [x] Agent analysis pass + claims import (incl. rejected case)
- [x] demo-runbook CTO scenario + product-claims update

Evidence: `reviews/bigtop10-cto-eval.md` (scan stats, C1–C5 Lane B results,
claims pass 6 accepted / 1 rejected with reason, demo bar manual pass,
known limits). Fixes landed during the run: `--limit-repos` propagated to
bundle repos.json, `scan-repo-profiles` empty-module-id crash, `run_shard`
exit-code capture, jscpd `--absolute`, README-title noise filter.
