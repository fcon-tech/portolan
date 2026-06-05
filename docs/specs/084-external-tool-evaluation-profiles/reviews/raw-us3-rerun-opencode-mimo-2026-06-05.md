Now I have the full picture. Here's my review:

---

## US3 Re-Review: External Tool Evaluation Profiles — spec 084

**Scope**: Role mapping boundary, producer-family schema reference, stale profile guidance, schema non-change.

### Findings

| # | Area | Severity | Evidence | Recommendation |
|---|------|----------|----------|----------------|
| 1 | Role mapping boundary covers all five labels | ✅ PASS | `docs/adapter-contracts/external-tool-evaluation-profiles.md:22-28` — Role Mapping Boundary table maps `producer_candidate`, `ux_pattern_source`, `ready_for_import_planning`, `blocked`, `rejected` to explicit `Decision`/`SupportState` pairs | No action |
| 2 | Producer-family schema reference exists | ✅ PASS | Refresh Procedure step 5 (`:137-139`) references `schema/producer-family.schema.json` and `docs/specs/053-language-agnostic-producers/`; Contract Evidence Rules (`contracts/external-tool-profile.md:28-30`) also reference it | No action |
| 3 | Stale profile guidance in generated answer contract | ✅ PASS | `internal/contextprep/contextprep.go:2434` renders: *"treat the profile as stale if its `Last refreshed` date is older than the current review window"* | No action |
| 4 | Stale profile guidance asserted in test | ✅ PASS | `internal/contextprep/contextprep_test.go:208` asserts the stale-profile string is present in `answer-contract.md` | No action |
| 5 | No schema changes | ✅ PASS | `schema/producer-family.schema.json` last modified in commit `de251ce` (spec 053); no spec-084 diff touches any schema file | No action |

### MiniMax F-3 Status

MiniMax F-3 requested explicit role→Decision/SupportState mapping for all five states. The Role Mapping Boundary table at `docs/adapter-contracts/external-tool-evaluation-profiles.md:22-28` now provides that mapping. **F-3 is resolved.**

### Not Assessed

- **Kimi certificate rerun**: failed; not counted as assessed evidence per AGENTS.md rules.
- **GitHub checks / PR state**: no PR exists yet.

### Verdict

**PASS** — All five checks satisfied. The MiMo rerun assessment is accurate and the MiniMax F-3 finding is resolved by the Role Mapping Boundary table.
