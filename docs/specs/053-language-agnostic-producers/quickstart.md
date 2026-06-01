# Quickstart: Language Agnostic Evidence Producers

This quickstart describes the intended validation path for implementation.

## Fixture Setup

Create a mixed local fixture with:

- a PHP-like repository containing Composer files;
- a JVM-like repository containing Maven or Gradle files;
- a deployment/model repository containing Docker, Puppet, RPM, or compose
  files;
- local dependency evidence for one repository;
- no local symbol-index output;
- partial API/catalog/model evidence.

## Expected Context Preparation

Run:

```bash
go run ./cmd/portolan context prepare --root <fixture-root> --out <context-dir> --profile cursor --force
```

Verify:

- the context pack contains producer-family recommendations for missing
  symbol/reference, API/catalog/model, static finding, duplication, config, or
  runtime-observation evidence when applicable;
- recommendations preserve `not_assessed`, `unknown`, or `cannot_verify`;
- candidate tools are described as options, not verified support;
- candidate tools are objects with `verification_state` and `support_state`,
  not plain strings;
- answer-contract text says Portolan does not own native PHP/JVM/Scala/
  TypeScript/shell semantics from recommendations alone.

## Expected Evaluation Records

Add local fixture records for at least two candidate producer families.

Verify:

- each candidate has decision, fit, output contract, local execution, license,
  maintenance, privacy, and integration-cost fields;
- candidates without local evidence remain `not_assessed`;
- risky candidates are rejected, blocked, or narrowed instead of becoming
  defaults.
- Portolan validates and surfaces the evaluation record; it does not score,
  rank, probe, install, or run the candidate producer itself.

## Expected Stress Follow-Up

Run Cursor + Composer 2.5 against the refreshed context pack.

The agent should:

- use producer-family recommendations to name next evidence actions;
- avoid proposing a Portolan-owned adapter for each language;
- avoid treating recommendations as observed evidence;
- preserve runtime topology, complete call graph, and unsupported semantics as
  `not_assessed`.
