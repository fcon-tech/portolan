# Cursor-Plus-Portolan Prompt

You are evaluating the local Apache Bigtop landscape with Portolan-generated
bounded artifacts.

Target:

```text
/home/fall_out_bug/projects/bigtop-landscape
```

Required first-pass artifacts:

```text
/tmp/portolan-034-bigtop-context/
/tmp/portolan-034-bigtop-map/summary.json
/tmp/portolan-034-bigtop-map/graph-index.json
```

Allowed drill-down:

- Use targeted `portolan graph slice` outputs only when needed.
- Do not load `/tmp/portolan-034-bigtop-map/graph.json` as the first-pass
  input.

Constraints:

- Do not use network access.
- Do not mutate the target.
- Preserve `unknown`, `cannot_verify`, and `not_assessed` where Portolan
  artifacts do not support a claim.
- Keep local checkout scope separate from full Apache Bigtop ecosystem
  completeness.

Answer the five questions from
`docs/specs/034-cursor-comparison-validation/reviews/shared-five-question-prompt.md`
using the required answer shape from that file.
