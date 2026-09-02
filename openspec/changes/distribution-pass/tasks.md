## 1. Explore — registry primaries (assumptions re-checked before anything ships)

- [ ] 1.1 Read the official MCP Registry primaries: `server.json` manifest schema, name convention, domain/ownership verification procedure; record findings in this change's `design.md` (amend decisions/spec deltas openly if reality disagrees). Verify: each design assumption tagged "*Assumption*" is confirmed with a primary citation or amended.
- [ ] 1.2 Check npm: org `portolan` availability; trusted publishing (OIDC) support for a Bun-run package — or confirm the fallback (granular token in a GitHub secret). Verify: findings recorded with primary citations; decision 1 fallback resolved.

## 2. Packaging — the monopackage and its bin

- [ ] 2.1 Make `core/package.json` publishable: files allowlist (core, skill, adapters), `bin` entry `portolan` with the `serve`/`chartroom`/`harbor` dispatcher, repository/metadata fields; first published version `0.4.4`. Verify: `bun test` green; `npm pack` (dry run) shows exactly the intended file set.
- [ ] 2.2 Implement the `portolan` dispatcher (serve/chartroom/harbor) delegating to the existing entry points; `serve` behavior indistinguishable from `core/src/server/main.ts`. Verify: new deterministic tests for argument routing; `portolan serve --target <province>` answers a tools/list call with the fourteen tools.

## 3. Registry manifest and CI sync gate

- [ ] 3.1 Commit `server.json` at repo root per the schema from task 1.1 (name per the registry convention, version = `@portolan/core` version). Verify: manifest validates against the official schema with a local check script.
- [ ] 3.2 CI job: schema-validate `server.json` and fail on version drift from `core/package.json`. Verify: green run on a synced state; a forced drift in a scratch branch fails the job naming the mismatch.

## 4. Publish gate

- [ ] 4.1 Add the version-gated publish job (merge to main + version grew → publish once; unchanged version → no job) using the mechanism resolved in task 1.2, no long-lived secrets in the repo; before the Governor's one-time setup exists, the job reports blocked naming the missing step and publishes nothing. Verify: job logic covered by workflow-level checks; dry-run shows the three outcomes (publish / skip / blocked).

## 5. Install path — installer, skill, docs

- [ ] 5.1 Decide and implement skill delivery from the installed package (copy vs reference — against how opencode/pi/omp resolve skill directories, per task 1 findings); keep harness differences in adapters. Verify: after install on a machine without a clone, the harness loads the skill.
- [ ] 5.2 Switch `adapters/opencode/install.ts` to the npm launch line (`bunx portolan serve --target …`) with no `REPO_ROOT` dependency; keep the JSONC surgery. Verify: new test writes a config whose launch line contains no repo path; launching it against a target serves the fourteen tools.
- [ ] 5.3 Update README quickstart and `skill/SKILL.md` install references to the registry-based path. Verify: no quickstart/skill instruction tells a fresh user to clone the repository (`grep -n "clone" README.md skill/SKILL.md` clean or justified).

## 6. Blocked-on-Governor (account-bound; instructions delivered, agent does not execute)

- [ ] 6.1 Write the Governor's runbook: create npm org `portolan` (or record fallback), configure trusted publishing, first manual release `0.4.4`, registry registration + domain verification. Verify: runbook in this change's directory; every step maps to a spec requirement's blocked scenario.
- [ ] 6.2 After the Governor completes the runbook: record npm + registry listing evidence (package URL, registry entry URL) in the task report. Verify: `npm view @portolan/core version` returns the published version; the registry entry resolves. Until this lands, the publish and listing scenarios stand `blocked`, not ready.

## 7. Verification battery

- [ ] 7.1 Full battery green before merge: `bun test`; `bunx tsc --noEmit` in `core/` and `acceptance/`; `openspec validate --specs --strict`; `bun run skill/verify/checks.ts`; `scripts/leak-gate.sh`. Verify: all commands' outputs pasted in the task report, failures named.
