# Governor runbook — one-time setup for distribution

Account-bound steps only you can perform. Until these are done, the CI
publish job reports **blocked** and publishes nothing; the listing
scenarios stand `blocked`, never ready. Facts below are from primaries
checked 2026-09-02 (design.md — Explore findings).

## 1. npm org and package existence

1. Sign in at npmjs.com → profile → "Add an Organization" → name
   `fcon-tech` → "Unlimited public packages" (free).
   - If the org already exists, confirm you can publish to it.
2. First manual release (creates the package; nothing can auto-publish
   before this):
   ```
   bun install && npm pack && npm publish --access public
   ```
   The manual release uses your own `npm login` — no OIDC involved
   (trusted publishing matters only for the later CI job). RESOLVED
   2026-09-02: the Governor chose MIT — LICENSE + `"license": "MIT"` are
   in the tree; no npm license warning is expected.
3. In the package's npm settings → "Trusted Publisher": link
   github.com/fcon-tech/portolan, workflow `ci.yml` (the `publish` job). (One trusted
   publisher per package. The CI job's publish step runs Node 22 +
   npm ≥11.5.1 on a GitHub-hosted runner — nothing for you to install.)

Verify: `npm view @fcon-tech/portolan version` returns the published
version.

## 2. MCP Registry listing

1. Confirm you are an **Owner** of the GitHub org `fcon-tech` (required
   for `io.github.fcon-tech/*` names).
2. Install `mcp-publisher` from the official registry repo only —
   follow the installation section of
   github.com/modelcontextprotocol/registry (README). Do NOT
   `npx mcp-publisher`: the npm package of that name is maintained by a
   third party (verified 2026-09-02, `measured`). Then, as the org
   owner: `mcp-publisher login github` (device flow), then
   `mcp-publisher publish`.
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
