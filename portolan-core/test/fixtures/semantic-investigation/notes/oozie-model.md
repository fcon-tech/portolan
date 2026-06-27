# Oozie internal model + not_assessed boundaries (curated note)

> Source card: `source:oozie-curated-model`. Backs the internal-model concepts
> for the Oozie component investigation (captain-atlas 17). This component is
> the sample's **incomplete-local-evidence** case: it is retired (Apache Attic)
> and metadata-visible only, so several claims are explicitly `not_assessed`
> with a concrete next producer.

## What this note explains (curated knowledge)

Oozie was a workflow scheduler for Hadoop. Four concepts:

1. **Workflow** — a DAG of Hadoop actions (MapReduce, Pig, Hive, fs, shell)
   defined in XML (hPDL). Control nodes (start, end, fork/join, decision)
   structure the flow.
2. **Coordinator** — a time/data trigger that schedules recurring workflow runs
   (frequency + data availability predicates). This is the scheduling layer on
   top of workflows.
3. **Bundle** — a higher-level grouping of coordinators, to manage a pipeline
   of pipelines together.
4. **HCatalog integration** — Oozie can trigger on table partition availability
   via HCatalog, tying workflows to the Hive metastore.

## What this note cannot verify (the not_assessed boundary)

Oozie is **retired** (Apache Attic) and only metadata-visible in this corpus.
The following are explicitly `not_assessed` with the producer that would close
each gap:

- **Runtime behavior**: the corpus has no running Oozie instance. Next producer:
  a runtime/deploy probe in an approved sandbox would confirm the current
  workflow XML actually executes (but the project is retired, so this is low
  value — the gap is documented, not chased).
- **Source-level recipe correctness**: the Bigtop packaging recipe for Oozie is
  metadata-only here. Next producer: a source-anchored scan of
  `bigtop-packages/src/oozie/` would pin the exact recipe version and patches.

These gaps are honest: the investigation says what it knows (the conceptual
model, curated) and says what it cannot verify, rather than implying runtime
truth from metadata.
