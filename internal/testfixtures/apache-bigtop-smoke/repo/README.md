# Apache Bigtop Smoke Fixture

This tiny local fixture stands in for the Apache Bigtop root repository during
the first Portolan skill smoke.

It intentionally does not clone or vendor upstream Bigtop sources. The fixture
only proves that current Portolan commands can read local repository,
metadata, runtime, and claim inputs while preserving evidence states.
