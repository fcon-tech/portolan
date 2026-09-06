# Governor runbook — one-time setup for distribution

Account-bound steps only you can perform. Until these are done, the CI
publish job reports **blocked** and publishes nothing; the listing
scenarios stand `blocked`, never ready. Facts below are from primaries
checked 2026-09-02 (design.md — Explore findings).

## 1. npm org and package existence

Division of labor (verified against npm primaries 2026-09-02): the
Governor owns the identity — login, one web form, 2FA codes; the
Cartographer agent runs every command and all verification.

1. Governor: log in to npm (`npm login` on this machine; 2FA on the
   account is required later by `npm trust`). Then create the org —
   npmjs.com → profile → "Add an Organization" → name `fcon-tech` →
   "Unlimited public packages" (free; npm has no org-creation CLI —
   registry probe 2026-09-02: scope not found, so it does not exist yet).
2. First manual release (creates the package; nothing can auto-publish
   before this) — run from repo root:
   ```
   npm install -g npm@latest   # the local npm is 10.9.4; trust needs >= 11.15
   bun install && npm pack && npm publish --access public
   ```
   The manual release uses the logged-in session — no OIDC involved
   (trusted publishing matters only for the later CI job). RESOLVED
   2026-09-02: the Governor chose MIT — LICENSE + `"license": "MIT"` are
   in the tree; no npm license warning is expected.
3. Trusted publisher — from the CLI, no web UI (docs.npmjs.com/cli/
   v11/commands/npm-trust):
   ```
   npm trust github @fcon-tech/portolan --repo fcon-tech/portolan \
     --file ci.yml --allow-publish --yes
   ```
   Requirements: npm >= 11.15.0 (the local npm is 10.9.4 — upgrade
   first), write access to the package, 2FA at the account level
   (granular tokens with bypass-2FA are not accepted — this is why the
   interactive login of step 1 is the Governor's). One trusted publisher
   per package. The CI job's publish step runs Node 22 + npm 11.5.1 on a
   GitHub-hosted runner — nothing to install there.

Verify: `npm view @fcon-tech/portolan version` returns the published
version.

## 2. MCP Registry listing — automatic since 0.4.6

The listing rides the CI publish job: after npm publishes, the job runs
`mcp-publisher login github-oidc` + `mcp-publisher publish` with the
workflow's own OIDC token — bound to this repository, no OAuth app, no
personal token, no org-settings change. Every version-grown merge
updates both npm and the registry. (Manual fallback: install
`mcp-publisher` from the official registry repo releases — NOT
`npx mcp-publisher`, that npm package is a stranger's — then
`mcp-publisher login github` + `publish`. Note: org namespaces require
the Owner role, and GitHub orgs with third-party app restrictions will
hide the org from the device-flow check — the OIDC path has neither
problem.)

## 3. After setup

Everything else is automatic: merges to main with a grown version
publish to npm (publish.yml), CI validates server.json on every push.
Record the two URLs (npm package, registry entry) in the change's task
report — that is task 6.2, the last `blocked` item.

## Deliberately not decided here

- Unpublish/rollback procedure — manual, decided if ever needed.
