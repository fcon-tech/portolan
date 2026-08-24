## 1. Harbor core: fingerprint, snapshot, history

- [x] 1.1 Implement the proposal fingerprint (sha256 of kind + sorted
      evidence keys, no timestamps) and verify stability/effect tests:
      same evidence → same fingerprint; drift growth → new fingerprint
- [x] 1.2 Implement the landscape snapshot (repos + manifests listing
      stored with the chart index hash; refresh when the hash changes)
      and verify tests: new repo with unchanged chart → detected; chart
      write → snapshot refresh clears stale new-land
- [x] 1.3 Implement append-only decision history under
      `.portolan/harbor/` (fingerprint, decision, timestamp) with
      last-decision-per-fingerprint lookup and verify the append-only
      contract in a test

## 2. Proposal engine

- [x] 2.1 Implement `computeProposals(targetRoot)` reading the chart
      (with staleness refresh), the snapshot, and the history: repair
      (drifted vessels + changed-file anchors), gap (no behavior / no
      light per vessel), new-land (unsnapped repos), ranked repair >
      new-land > gap then evidence size; declined fingerprints filtered
      — and verify scenario tests: drift→repair, gap→survey, still
      province→empty queue, refusal holds, evidence change reopens
- [x] 2.2 Implement `decide(targetRoot, fingerprint, decision)` writing
      history and verify accept/declide round-trips plus rejection of
      unknown fingerprints

## 3. Settings + headless CLI

- [x] 3.1 Implement `.portolan/settings.json` reading (`harbor.schedule`,
      absent by default, unknown keys tolerated with a warning) and
      verify defaults and warning behavior in tests
- [x] 3.2 Implement the headless CLI `core/src/harbor/cli.ts propose`
      with `--format chat` (deterministic chat-formatted queue, golden
      test) and verify two runs over an unchanged province emit identical
      output

## 4. MCP surface

- [x] 4.1 Register `expeditions.propose` and `expeditions.decide` in the
      tool registry (input schemas; rejections as tool errors) and verify
      the served tool list is exactly the eleven names through the live
      stdio server
- [x] 4.2 Update every test asserting the nine-tool surface (count
      constants, adapter launch-line checks, crash-resistance sequence)
      and verify the full suite is green

## 5. Skill + docs

- [x] 5.1 Update `skill/SKILL.md`: session-start queue surfacing in chat
      (top proposals with evidence summary and scope, one-phrase
      acceptance, decision recorded, silence on empty queue) and extend
      the tool desk with the two new tools — verify via the skill checks
      harness (banned synonyms still absent, all tool names present)
- [x] 5.2 Document the settings file and external scheduler wiring
      (cron/CI calling the headless CLI) in the adapters README and
      verify the docs match the CLI flags actually implemented

## 6. Delivery: province AGENTS.md block

- [x] 6.1 Extend the opencode adapter installer to write an idempotent
      managed Portolan block into the province's AGENTS.md (harbor
      protocol: propose at session start, present queue, one-phrase
      decision, chart-first answers, skill path, perimeter) and verify
      idempotent merge tests plus preservation of existing content
- [x] 6.2 Live-verify without prompt injection: a plain opencode session
      in the province presents the harbor queue before other work
