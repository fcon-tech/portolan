# Quickstart

## Fixture Check

Run focused tests:

```bash
go test ./internal/contextprep
```

Expected:

- A fixture with `pom.xml` creates a `maven-cyclonedx` plan.
- A fixture with `build.gradle` creates a `gradle-cyclonedx` plan.
- Both plans require approval and keep evidence `not_assessed`.

## Bigtop Smoke

Prepare a fresh context pack:

```bash
RUN_ID=20260602-078-build-tool-dependency-producers
OUT=/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/$RUN_ID
rm -rf "$OUT"
mkdir -p "$OUT"
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out "$OUT/context" \
  --profile agent \
  --force
jq '.tools[] | select(.id == "maven-cyclonedx" or .id == "gradle-cyclonedx")' "$OUT/context/oss-plan.json"
```

Expected:

- Maven and Gradle producer plans are present when build manifests are visible.
- No Maven, Gradle, Syft, jscpd, Docker, or runtime producer is executed.
- Java/Scala/Maven dependency graph remains `not_assessed` until an approved
  native output is supplied and selected/imported.
