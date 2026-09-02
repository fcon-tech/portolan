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
   (npm ≥11.5.1 under Node ≥22.14.0 for the OIDC step; run from repo root
   after merge of this change. `npm publish` warns about the missing
   `license` field — the repo declares none; decide: add a LICENSE +
   `license` field, or set `"license": "UNLICENSED"` honestly. This is
   your call, not the agent's.)
3. In the package's npm settings → "Trusted Publisher": link
   github.com/fcon-tech/portolan, workflow `publish.yml`. (One trusted
   publisher per package.)

Verify: `npm view @fcon-tech/portolan version` returns the published
version.

## 2. MCP Registry listing

1. Confirm you are an **Owner** of the GitHub org `fcon-tech` (required
   for `io.github.fcon-tech/*` names).
2. `npx mcp-publisher@latest init` (fills from server.json), then
   `npx mcp-publisher@latest login github` (device flow as the org
   owner), then `npx mcp-publisher@latest publish`.
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

- LICENSE choice (repo has none) — your decision; npm needs a `license`
  field before the publish is clean.
- Unpublish/rollback procedure — manual, decided if ever needed.
