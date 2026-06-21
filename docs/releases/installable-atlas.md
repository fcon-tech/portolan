# Portolan Installable Atlas Release Notes

Portolan is a local-first atlas pack for AI agents. It installs target-local
wrappers into a local target, reads local source, metadata, optional local tool
outputs, and explicitly supplied runtime or claim files, then writes bounded
artifacts an agent can query before making architecture or codebase claims.

## Install

```bash
git clone https://github.com/fcon-tech/portolan.git
cd portolan
scripts/portolan-install.sh <target-root> --harness all --bundle-dir <target-root>/.portolan/atlas
```

Then run the installed wrapper from the target:

```bash
<target-root>/.portolan/bin/portolan-scan.sh \
  <target-root> \
  <target-root>/.portolan/atlas \
  --yes --skip-install --no-viewer
```

Open the viewer through the target-local wrapper:

```bash
<target-root>/.portolan/bin/portolan-viewer.sh
```

Remove `--skip-install` only after explicit approval to install missing local
OSS tools. Missing producers stay visible as gaps.

## What Is Verified

- Target-local Cursor/OpenCode install files and `.portolan/bin` wrappers.
- Live headless Cursor and OpenCode runtime lanes on isolated local targets.
- Clean source-copy install, scan, query, claim import, and viewer wrapper smoke.
- Atlas artifacts, schema validation, bundle-query, MCP query smoke, and viewer
  static build.
- Bigtop corpus acceptance against a prepared local bundle, including consistent
  `manifest.json`, `repos.json`, and `landscape-card.json` repo counts plus
  `cross_repo_duplication.status=complete`.
- Current product claims and limitations governed by `docs/product-claims.md`.

## Example Route

The Apache Bigtop route is documented in `docs/demo.md` and
`docs/demo-runbook.md` as a named local stress example, not proof of complete
ecosystem coverage or broad benchmark superiority. Preserve `not_assessed`,
`failed`, `blocked`, `unknown`, and `cannot_verify` states.

## Limits

- Cursor/OpenCode runtime support is limited to the verified headless CLI lanes;
  arbitrary future UI modes and releases remain `not_assessed`.
- Complete inherited-estate coverage is not proven by repository count.
- Complete runtime topology remains `not_assessed` without complete supported
  local runtime evidence.
- Portolan has focused local CLI security boundary tests, not broad security
  certification.
- No popularity, adoption, customer, star, fork, or production-usage claim is
  made.

## Release State

- Local product acceptance: must pass before publication.
- Fresh-clone product acceptance: must pass before publication.
- GitHub checks: must be checked on the release commit or PR.
- Human review approval: `not_assessed` until a reviewer approves.
- Merge/release authorization: `not_assessed` until the maintainer explicitly
  authorizes it.
