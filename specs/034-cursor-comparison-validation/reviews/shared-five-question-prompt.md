# Shared Five-Question Prompt

Use the same five CTO questions for both Cursor-alone and
Cursor-plus-Portolan. Preserve uncertainty explicitly.

Target:

```text
/home/fall_out_bug/projects/bigtop-landscape
```

Questions:

1. What is the local scope and what completeness is unknown?
2. What duplicate or component risk can be safely claimed?
3. What implicit knowledge appears in local evidence, and what is only a
   claim?
4. What service relationships can be safely stated?
5. What are the most useful next local actions?

Required answer shape:

```text
## Scope And Completeness
## Duplicate Or Component Risk
## Implicit Knowledge
## Service Relationships
## Next Local Actions
## Unknowns And Not Assessed
```

Rules:

- Do not use network access.
- Do not mutate the target.
- Do not claim complete Apache Bigtop ecosystem coverage unless local evidence
  proves it.
- Mark unsupported or missing evidence as `unknown`, `cannot_verify`, or
  `not_assessed`.
