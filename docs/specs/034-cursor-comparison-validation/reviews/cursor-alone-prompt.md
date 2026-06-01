# Cursor-Alone Prompt

You are evaluating the local Apache Bigtop landscape without Portolan-generated
artifacts.

Target:

```text
/home/fall_out_bug/projects/bigtop-landscape
```

Constraints:

- Do not use Portolan-generated context packs, map bundles, `summary.json`,
  `graph-index.json`, `graph.json`, `map.md`, or prior Portolan ledgers.
- You may inspect the target filesystem directly.
- Do not use network access.
- Do not mutate the target.
- Keep local checkout scope separate from full Apache Bigtop ecosystem
  completeness.

Answer the five questions from
`docs/specs/034-cursor-comparison-validation/reviews/shared-five-question-prompt.md`
using the required answer shape from that file.
