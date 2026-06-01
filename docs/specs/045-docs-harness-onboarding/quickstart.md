# Quickstart: Docs And Harness Onboarding

Use this to verify the documentation slice.

## 1. Route From README

Open `README.md` and confirm it links to `docs/onboarding.md` from the agent/documentation area.

## 2. Route From Agent Docs

Open `docs/agent/QUICKSTART.md` and confirm it points operators to `docs/onboarding.md` for Cursor and OpenCode boundaries.

## 3. Check OpenCode Output Guidance

Open `docs/onboarding.md`, `docs/agent/INSTALL.md`, and `docs/agent/INSTALL-PROMPT.md`. Confirm they recommend repo-local `.portolan/runs/...` output for OpenCode default-permission runs and do not claim arbitrary external output paths are verified.

## 4. Check Cursor Boundary

Open `docs/onboarding.md`. Confirm it states that current verified Cursor evidence is headless Cursor Agent CLI / Composer evidence and that Cursor UI remains outside the current required acceptance scope.

## 5. Run Documentation Verification

```bash
git diff --check
rg -n "docs/onboarding.md|OpenCode|Cursor UI|repo-local" README.md docs/agent docs/ru docs/onboarding.md docs/product-backlog.md
rg -n "docs/onboarding.md" docs/agent/QUICKSTART.md docs/agent/QUICKSTART.ru.md README.md docs/ru/README.md
```

If the environment allows, run the repository baseline:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
```
