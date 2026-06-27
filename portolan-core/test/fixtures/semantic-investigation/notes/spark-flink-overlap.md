# Spark vs Flink overlap and contrast (curated note)

> Source card: `source:spark-flink-overlap`. Backs the **bidirectional**
> `overlaps_with` / `contrasts_with` relations between Spark and Flink
> (captain-atlas 17 §6). This note explains where they overlap (>= 3
> dimensions) and where they diverge, so opening either component shows the
> other with the same reasoning.

## Why both exist in the ecosystem

Spark and Flink both occupy the **distributed data-processing** capability
region of the Bigtop ecosystem. Both run on a cluster coordinated against
Hadoop (YARN), both process large datasets in parallel across workers, and both
appear in the same Bigtop 3.5.0 distribution as compute components. That is the
overlap: the ecosystem ships two engines that can move and transform big data.

## Where they overlap (the dimensions)

1. **Problem space** — both are distributed compute engines over partitioned
   data with a DAG execution model. Both answer "how do I process more data than
   fits on one machine?"
2. **Ecosystem placement** — both depend on Hadoop (filesystem + YARN), both
   sit in the compute-processing capability region, and Bigtop packages both.
3. **API surface** — both offer a higher-level declarative API (Spark
   DataFrames / Flink DataStream + Table) over a lower-level execution core.

## Where they contrast (why the ecosystem contains both)

4. **Streaming model** — Spark uses **micro-batch** streaming (Structured
   Streaming runs batches on a trigger); Flink is a **true streaming** engine
   (event-at-a-time). This is the decisive axis: Spark favours throughput and
   batch-origin simplicity; Flink favours low latency and per-event semantics.
5. **State and consistency** — Flink builds exactly-once on checkpointed state
   backends (stateful streaming is first-class); Spark's state model is
   lighter and batch-oriented. For stateful, low-latency pipelines Flink is the
   stronger fit; for large batch/ETL Spark is typically simpler.
6. **Latency profile** — Spark micro-batch latency is bounded by the trigger
   interval (seconds+); Flink can reach sub-second. A latency-sensitive
   workload is the clearest reason to choose Flink over Spark.

## Bidirectionality

This reasoning is symmetric: whether the admiral opens Spark or Flink, the
overlap is the same set of dimensions, and the contrast is the same streaming /
state / latency trade-off (phrased from the other side). The investigation data
declares the relation on BOTH components so neither direction is invented.
