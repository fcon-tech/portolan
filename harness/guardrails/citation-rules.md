# Citation Rules (Guardrail)

Every material claim about duplication, static issues, dependencies, or debt
must include:

1. `hotspot.id` from `hotspots.jsonl`, or an explicit gap id from `gaps.jsonl`.
2. `producer_ref` path when the hotspot is observed.
3. `evidence_state` — do not paraphrase as certainty.

Answer shape:

- **Finding** — one sentence.
- **Evidence** — hotspot id + producer_ref.
- **Unknowns** — gaps that limit the answer.
- **Next step** — one recipe or file path to inspect.

Do not cite `answer-contract.md` or legacy context packs on the harness-first path.
