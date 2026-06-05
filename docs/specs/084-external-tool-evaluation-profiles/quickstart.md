# Quickstart: External Tool Evaluation Profiles

This feature is documentation and context guidance first. It does not execute
external tools.

## Verify Profile Guidance

1. Read `docs/adapter-contracts/external-tool-evaluation-profiles.md`.
2. Confirm the profile table includes `colbymchenry/codegraph`,
   `Lum1104/Understand-Anything`, and
   `defendend/Claude-ast-index-search`.
3. Confirm every profile has role, license, last refresh date, output surfaces,
   risk boundaries, approval boundaries, and recommended Portolan action.
4. Confirm ast-index is the strongest current symbol/reference producer
   candidate, CodeGraph is lower-fit optional, and Understand-Anything is UX
   inspiration rather than verified evidence.
5. Refresh GitHub metadata before marking the PR ready if more than one day has
   passed since the profile `last_refreshed` date.

## Verify Context Pack Behavior

```bash
go test -count=1 ./internal/contextprep
go run ./cmd/portolan context prepare --root . --out /tmp/portolan-084-context --force
jq empty /tmp/portolan-084-context/oss-plan.json
```

Expected result:

- context guidance may mention external tool profiles as candidate guidance;
- graph facts and evidence states are not promoted;
- no external tool is installed, executed, watched, or started.

## Baseline

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
