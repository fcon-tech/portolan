# Implementation Plan: Configuration Surface Detection

## Decision Gate

- Simpler/Faster: add a bounded lexical file-surface detector for env refs,
  ports, container/workflow/manifest files, feature flags, and secret
  references. Do not add YAML parsers, cloud SDKs, or a policy engine.
- Blocking Edge Cases: semantic IaC analysis, Helm templating, cloud resource
  lookup, generated files, lockfiles, large files, and secret payloads can
  produce noisy or unsafe outputs. This slice must inventory local evidence
  without exposing values or claiming semantic correctness.
- Existing Open Source: Semgrep and IaC/config scanners are mature OSS options
  for semantic checks. Portolan keeps them in the OSS/tool-output path and adds
  only a deterministic native baseline.

## Technical Approach

- Add an internal `configuration` detector for bounded text candidates.
- Detect file-family surfaces from path names: container, workflow, manifest,
  and config files.
- Detect content surfaces with redacted evidence only:
  - env var references such as `$NAME`, `${NAME}`, `process.env.NAME`,
    `os.Getenv("NAME")`, and `.env` keys;
  - port declarations such as `ports:`, `EXPOSE`, `PORT=`, and `listen`;
  - feature-flag references by name only;
  - secret references by key/name only, never values.
- Emit graph nodes and `configuration` findings from `portolan map`.
- Preserve `not_assessed` when no native or imported configuration evidence is
  observed.

## Verification

Run:

```bash
go test ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan map --root testdata/configuration-surfaces/repo --out /tmp/portolan-012-config --force
while IFS= read -r line; do printf '%s\n' "$line" | jq empty; done </tmp/portolan-012-config/findings.jsonl
rg 'super-secret|postgres://|password-value' /tmp/portolan-012-config && exit 1 || true
```
