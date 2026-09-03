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

## 2. MCP Registry listing

1. Confirm you are an **Owner** of the GitHub org `fcon-tech` (required
   for `io.github.fcon-tech/*` names).
2. Install `mcp-publisher` from the official registry repo only —
   follow the installation section of
   github.com/modelcontextprotocol/registry (README). Do NOT
   `npx mcp-publisher`: the npm package of that name is maintained by a
   third party (verified 2026-09-02, `measured`). Then
   `mcp-publisher login github` — a device flow: the agent runs it, the
   Governor approves in the browser (must be an Owner of the fcon-tech
   GitHub org) — then the agent runs `mcp-publisher publish`.
   - Domain-based alternatives (DNS TXT on the apex, or
     `/.well-known/mcp-registry-auth`) exist if you prefer not to use
     GitHub OAuth.
3. Note: the registry is in **preview** — listings can be re-published
   after breaking changes; versions are immutable per publication.

Verify: `curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=portolan"`
resolves the entry.

## 3. After setup

Everything else is automatic: merges to main with a grown version
publish to npm (publish.yml), CI validates server.json on every push.
Record the two URLs (npm package, registry entry) in the change's task
report — that is task 6.2, the last `blocked` item.

## Deliberately not decided here

- Unpublish/rollback procedure — manual, decided if ever needed.
