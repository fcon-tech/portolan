# Socratic Review Prompt: Spec 109

You are reviewing a Portolan product specification, not implementing it.

Portolan is a local-first, read-only codebase mapping toolbox for agents and
humans exploring large multi-repo software landscapes. It must not become a
coding harness, service catalog, observability platform, readiness gate, or
source of truth for claims it cannot verify. It prefers importing mature OSS
tool outputs over reimplementing scanners.

Review these files:

- `docs/specs/109-evidence-promotion-stratified-atlas/spec.md`
- `docs/specs/109-evidence-promotion-stratified-atlas/plan.md`
- `docs/specs/109-evidence-promotion-stratified-atlas/tasks.md`

Socratic review goal:

Stress-test whether the spec prevents scope narrowing and product drift while
remaining implementable. Do not praise the document. Find the places where a
team could still ship a misleading prototype and call it done.

Questions to answer:

1. Does the spec define the full product capability, or can it collapse into a
   narrow ctags/viewer patch?
2. Are the BDD scenarios specific enough to become tests?
3. Are evidence states, health statuses, claims, facts, findings, and raw
   artifacts separated correctly?
4. Does the plan rely on building scanners Portolan should import from OSS?
5. Does `not_integrated` prevent false completion, or does it create a loophole
   for shipping permanent gaps?
6. Are local-first/read-only/security boundaries explicit enough?
7. Does the viewer/query acceptance cover agent use, not only human UI?
8. What would you reject before implementation?

Output format:

- Findings first, ordered `critical`, `major`, `minor`.
- Each finding must include file and section.
- Mark unverified implementation claims as `not_assessed`.
- End with a recommendation:
  - `proceed`
  - `proceed after fixes`
  - `do not implement`

Be hostile but concrete.
