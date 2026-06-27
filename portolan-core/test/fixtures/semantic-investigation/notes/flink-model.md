# Flink internal model (curated note)

> Source card: `source:flink-curated-model`. Backs the internal-model concepts
> for the Flink component investigation (captain-atlas 17).

## What this note explains

Flink is a stream-processing engine (with a batch API layered on streaming). A
cold reader should understand five concepts:

1. **DataStream** — the core streaming API: a possibly-unbounded stream of
   events transformed through a pipeline. Flink models batch as a bounded
   stream, not the other way around (unlike Spark).
2. **Job graph** — the pipeline compiles to a JobGraph of operators executed by
   a JobManager (coordination) and TaskManagers (workers). This is the runtime
   shape of a Flink job.
3. **Checkpoint** — Flink achieves fault tolerance via distributed snapshots
   (checkpoint barriers flowing through the stream). This is the basis of its
   exactly-once processing guarantee.
4. **State backend** — operator state (keyed state, operator state) is stored
   in a state backend (e.g. RocksDB). Stateful streaming correctness depends
   entirely on how state is keyed, checkpointed, and restored.
5. **Windowing** — window operators group unbounded streams into finite windows
   (tumbling, sliding, session) over event/processing time. Window + watermark
   semantics are where most Flink correctness bugs live.

The chain: a DataStream pipeline → compiled to a job graph → executed by
JobManager/TaskManagers → state held in a backend and snapshotted via
checkpoints → windows define how events are grouped over time. Flink's identity
is "true streaming with stateful exactly-once," which is the axis on which it
contrasts with Spark (see spark-flink-overlap.md).
