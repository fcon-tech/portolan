# Quickstart: Real Producer Output Proof

## Preflight

1. Verify the branch:

   ```bash
   git status --short --branch
   ```

2. Verify the active feature:

   ```bash
   jq empty .specify/feature.json
   ```

3. Read the initial reconstruction:

   ```bash
   sed -n '1,220p' docs/specs/054-real-producer-output-proof/reviews/initial-bigtop-producer-gap-reconstruction-2026-06-01.md
   ```

## Expected Local Producer Outputs

The first implementation should be able to represent these already generated
outputs:

- `.portolan/stress/20260601-054-initial-proof/tool-outputs/apache-bigtop-compose.config.json`
- `.portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-monitor.helm-template.yaml`
- `.portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-grpc.descriptor.pb`

These outputs are deployment/model or API/RPC evidence. They are not runtime
topology evidence.

## Validation Expectations

After implementation, run:

```bash
go test -count=1 ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

Then run a focused context smoke against Bigtop:

```bash
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<run-id>/context \
  --profile cursor \
  --force
```

The resulting context must:

- surface verified producer-run metadata for selected local outputs;
- keep symbol/reference unavailable if no symbol-index output exists;
- keep runtime topology `not_assessed` without runtime observations;
- give Cursor enough bounded evidence to cite producer outputs without opening
  full raw artifacts first.

## Cursor Stress

Run headless Cursor + Composer 2.5 only after local Portolan artifacts are
refreshed. The prompt must ask for scoped Bigtop architecture answers and must
require citation to local producer evidence. Any unsupported runtime or semantic
claim is a stress finding, not proof.
