# Polyglot Service Landscape Fixture

This fixture represents a small non-JVM exported corpus for captain-atlas
acceptance. It exercises the same target-local atlas route on a Node API and a
Go worker without Bigtop-specific names or Maven/JVM assumptions.

Expected signals:

- two repository-like children under `repos/`;
- npm and Go module manifests;
- a declared dependency from the Node API to the Go worker;
- a Compose image reference from the Node API to the Go worker;
- one config hotspot for `docker-compose.yml`.
