# Agent Q&A Rubric — Portolan System Map

This is the Task G deliverable: Q&A prompts an agent must answer from Portolan,
the answer rubric, and selected-code test cases. Feature 6 acceptance.

## Answer Rubric

Every Portolan-sourced answer is scored on four axes. An answer is **useful**
only if it passes all four.

| Axis | Pass | Fail |
|------|------|------|
| **Useful** | Directly answers the captain's question with the right object(s). | Vague, hedging, or answers a different question. |
| **Grounded** | Cites a system-map object id + route, or a bounded-query result. | Cites raw JSONL/JSON file contents as the primary interaction. |
| **Concise** | Prose + at most a few structured refs; no dump of the whole map. | Pastes the full system-map.json or a large record list. |
| **Navigable** | Names the dossier route or next drill-down command. | Dead-ends with no route or next action. |

### Prohibited answer shapes (Feature 6)

- Answers whose primary evidence is a raw `cat`/`jq` over `*.jsonl` or
  `system-map.json`. The agent must use `portolan-bundle-query.sh system-map`
  or a bounded-query family instead.
- Answers that invent object ids or routes not present in the system map.
- Answers that hide `unknown` / `cannot_verify` / `not_assessed` states.

## Q&A Prompts (the agent must answer these from Portolan)

Each prompt lists the bounded-query command that grounds the answer.

1. **What are the main components of this target, and which family does each belong to?**
   Grounding: `portolan-bundle-query.sh system-map --bundle "$BUNDLE" --section components`
2. **What is risky or suspicious here?** (top findings + their affected components)
   Grounding: `system-map --section findings` cross-referenced with `--section components`.
3. **What is unknown or not assessed?** (honest gaps)
   Grounding: `system-map --section unknowns`.
4. **How do component X and component Y relate?** (relationship + direction + evidence)
   Grounding: `system-map --section relationships`, then the relationship dossier route.
5. **What surfaces exist for component X, and what kind are they?** (docs/CI/mailing-list/etc.)
   Grounding: `system-map --section surfaces --kind <type>` or filter by owner.
6. **Open the dossier for component X.** (the route + what it explains)
   Grounding: the component's `route` field → `#/dossier/component/<id>`.
7. **Is component X retired/legacy, and why is it still in the result?**
   Grounding: the component `lifecycle` + `why_present` fields.

## Selected-Code Test Cases

These verify bounded code-context retrieval (`selected-code` family) against the
polyglot-service-landscape fixture. An agent should answer "what is at this
location" without dumping the whole file.

| Case | Command | Expected |
|------|---------|----------|
| Go worker entrypoint | `portolan-bundle-query.sh selected-code --bundle "$BUNDLE" --path repos/worker-go/cmd/worker/main.go --line 1 --limit 5` | Returns a bounded snippet + symbol context for `main.go`, not the whole file. |
| Node API server | `portolan-bundle-query.sh selected-code --bundle "$BUNDLE" --path repos/api-node/src/server.js --line 1 --limit 5` | Returns a bounded snippet + symbol context for `server.js`. |
| Symbol lookup | `portolan-bundle-query.sh symbol --bundle "$BUNDLE" --name main --limit 5` | Resolves the `main` symbol to its repo + path. |

### Selected-code answer shape (rubric)

- **Pass**: the answer names the file, the symbol (if found), and a bounded
  window of lines, and cites the `selected-code` query result. It does NOT paste
  the full source file.
- **Fail**: the answer `cat`s the whole file, or cannot resolve the symbol, or
  invents a location.
