# Cursor Stress Prompt: Runtime Capture Preflight

Cursor stress test for Portolan Spec 062. Read-only QA. Do not edit files. Use
only packet below. Answer with labels `verified`, `cannot_verify`,
`not_assessed`, or `blocked`:

1. Are Bigtop runtime prerequisites verified?
2. Is Bigtop runtime topology verified?
3. Does passed env-check approve running
   `./docker-hadoop.sh --docker-compose-plugin --create 1`?
4. What is the exact next blocked approval-required command?

Preserve `cannot_verify`; do not promote Docker/Ruby/env-check readiness to
runtime-visible topology.

Packet:

- `spec.md`
- `plan.md`
- `reviews/preflight-ledger-2026-06-02.md`
