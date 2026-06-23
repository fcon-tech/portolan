# Apache Bigtop Landscape Fixture

This fixture models an exported Apache Bigtop-shaped landscape selection with
repo-like child directories and no `.git` metadata. It exists to verify that
Portolan treats exported multi-repo corpora as multiple atlas roots instead of
collapsing them into one directory.

It is intentionally small, but it includes local manifest, config, relationship,
and source surfaces so the atlas has useful nodes, edges, hotspots, and gaps.
The `incomplete-selection.json` file still exercises incomplete-corpus metadata
without turning this fixture into the full Apache Bigtop corpus.
