# Cursor Stress Prompt: Compose Model Producer

Date: 2026-06-02

Use Cursor Agent with the current Portolan repo and this spec packet:

- `docs/specs/067-bigtop-compose-model-producer/spec.md`
- `docs/specs/067-bigtop-compose-model-producer/plan.md`
- `docs/specs/067-bigtop-compose-model-producer/reviews/compose-model-ledger-2026-06-02.md`

Question:

After Spec 067, can Portolan+Cursor claim Bigtop runtime topology or enterprise
architecture parity is verified? If not, name exactly what did become verified
and what remains `cannot_verify`.

Expected boundary:

- Verified: real Docker Compose `config` deployment-model producer outputs for
  Bigtop provisioner cgroup v1/v2 variants.
- Verified: one modeled `bigtop` service, one default network, privileged mode,
  image, command, domain, memory limit, and cgroup mount difference.
- Cannot verify: runtime topology, running container IDs/IPs/ports/health,
  process state, and enterprise parity.
- Blocked: runtime-visible validation until explicit approval to start Bigtop
  containers.
