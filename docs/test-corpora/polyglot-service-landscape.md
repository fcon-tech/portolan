# Polyglot Service Landscape Test Corpus

This is the repeatable non-JVM smoke for the captain-atlas portability bar. It
uses the same local atlas route as the Bigtop-shaped fixture, but the target is a
small exported Node API plus Go worker landscape.

Fixture root:

```text
internal/testfixtures/polyglot-service-landscape
```

Acceptance command:

```bash
scripts/portolan-product-acceptance.sh --skip-agent-runtime
```

The product gate verifies that Portolan discovers two repository-like children,
records npm and Go module surfaces, emits relationship records, and keeps config
hotspots from `docker-compose.yml`. This is a portability smoke, not a large
corpus proof.
