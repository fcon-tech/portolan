# Quickstart: Runtime Security Boundary

1. Read `docs/runtime-observations.md`.
2. Validate the sample runtime observation fixture:

   ```bash
   go run ./cmd/portolan selection validate --selection internal/app/testdata/runtime-security-boundary/selection.json
   ```

3. Run a scan or map with the runtime input:

   ```bash
   go run ./cmd/portolan scan --selection internal/app/testdata/runtime-security-boundary/selection.json --out /tmp/portolan-runtime-graph.json --force
   go run ./cmd/portolan map --selection internal/app/testdata/runtime-security-boundary/selection.json --out /tmp/portolan-runtime-map --force
   ```

4. Inspect graph/map output and confirm supported runtime facts are
   `runtime-visible` while partial topology remains `unknown`.
5. Read `docs/security-threat-model.md` and verify each threat has a state.
