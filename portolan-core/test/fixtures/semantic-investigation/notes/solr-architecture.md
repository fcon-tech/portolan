# Solr architectural concepts (curated note)

> Source card: `source:solr-curated-architecture`. Backs the internal-model
> concepts for the Solr component investigation (captain-atlas 17). This is a
> checked-in curated note — it is the locally-meaningful artifact that makes the
> `curated-knowledge` claims resolvable without network access.

## What this note explains

Solr is a distributed search and indexing server. A cold reader should
understand five concepts before asking an agent to modify or investigate it:

1. **Inverted index** — documents are tokenized and stored in an inverted index
   (term → postings list). This is the data structure that makes term and
   boolean queries fast, and it is the reason schema design directly affects
   recall and ranking.
2. **Managed schema** — field definitions, analyzers, and tokenizers are
   declared in a schema. The schema decides how text is split and matched; a
   wrong analyzer is a query-quality bug, not a code bug.
3. **Query / parser** — queries are parsed (e.g. via the standard or eDisMax
   parser) against the schema. Relevance functions (TF-IDF, BM25) and boosts
   live here, separate from the index.
4. **Shard** — a collection is split into shards, each holding a horizontal
   slice of the index. Sharding is by document hash; the shard count is fixed at
   collection creation and is expensive to change later.
5. **Replica / SolrCloud coordination** — each shard has replicas (leaders +
   followers). SolrCloud uses ZooKeeper (an Overseer node) to elect shard
   leaders and route updates, so coordination is an operational concern, not
   just an index concern.

These concepts are interconnected: the schema feeds the analyzer that feeds the
index that the query parser reads; sharding splits that index across nodes;
replication + ZooKeeper coordination keep the shards available. Understanding
this chain is what lets the admiral reason about a search change before touching
source.
