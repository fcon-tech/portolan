# Cursor Composer 2.5 Stress Prompt: Integrated 079 + 080

You are Cursor Agent Composer 2.5 evaluating Portolan as a local-first
navigation harness for Apache Bigtop.

This is an integration stress lane for two pending Portolan changes:

- 079: repository-sharded jscpd next-action plan for large landscapes;
- 080: clean-start artifact boundary and stale producer-run scrubbing.

Target root:

`/home/fall_out_bug/projects/bigtop-landscape`

Allowed current Portolan context:

`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context`

Allowed reads:

- files directly under the allowed context directory above;
- path strings inside those context files as metadata only.

Forbidden reads:

- sibling `.portolan/stress/*` roots;
- root-level `run/`;
- root `.portolan/producer-runs.jsonl`;
- generated Portolan map bundles outside the allowed context;
- repository source files under `repos/`;
- any jscpd output outside the allowed context.

Forbidden actions:

- do not run jscpd or any other native OSS producer;
- do not install tools;
- do not create, edit, delete, or move files in the Bigtop target.

Task:

Evaluate whether the integrated context gives an agent adequate navigation
support for the Bigtop duplication/OOM gap while keeping clean-start evidence
hygiene intact.

Answer with these sections:

1. Lane State: `verified`, `failed`, or `contaminated`.
2. Artifacts Read: exact paths read.
3. Forbidden Path Check: `yes` if a forbidden path was read, otherwise `no`.
4. Clean-Start Guard Assessment:
   - whether a fresh artifact boundary is explicit;
   - whether stale sibling producer-run outputs are scrubbed/downgraded;
   - whether any stale output `path`, `output_path`, or `command` remains.
5. jscpd Plan Assessment:
   - status/evidence_state;
   - command count;
   - full-root vs repository-sharded;
   - write boundaries;
   - whether missing/failed/unrun shards remain non-counting evidence.
6. Supported Claims from this context only.
7. Unsupported Claims that remain `not_assessed`, `cannot_verify`, or
   `unknown`.
8. Product Verdict: does the combined context reach an adequate navigation
   harness level for the current duplication/clean-start gap, or what exact
   correction is still needed?
