# Spark internal model (curated note)

> Source card: `source:spark-curated-model`. Backs the internal-model concepts
> for the Spark component investigation (captain-atlas 17).

## What this note explains

Spark is a distributed data-processing engine. A cold reader should understand
five concepts:

1. **RDD** — the Resilient Distributed Dataset is the original fault-tolerant,
   partitioned, lazily-evaluated collection abstraction. It is the lowest-level
   API; newer code rarely uses raw RDDs directly, but they are the lineage basis
   for recovery.
2. **DataFrame / Dataset** — the higher-level tabular API over RDDs, with a
   schema. Most production code uses DataFrames because the optimizer can
   reason about them.
3. **Catalyst optimizer** — the query optimizer that turns DataFrame operations
   into an optimized physical plan. It is why two logically-equivalent
   DataFrame pipelines can have very different performance.
4. **DAG scheduler** — breaks a job into stages of tasks along shuffle
   boundaries and submits them to the cluster. Stage count and shuffle volume
   dominate Spark job performance.
5. **Executor** — a JVM process on a worker that runs tasks and holds cached
   data. Memory pressure on executors (cache vs. shuffle vs. user objects) is
   the most common operational failure mode.

The chain: code builds DataFrames → Catalyst optimizes → the DAG scheduler
plans stages → executors run tasks over partitioned data, with RDD lineage as
the recovery substrate. A change to a Spark job is really a change to one of
these stages.
