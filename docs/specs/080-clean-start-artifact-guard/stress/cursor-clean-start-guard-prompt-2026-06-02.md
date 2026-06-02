You are Cursor Agent `composer-2.5` evaluating Portolan as a navigation harness
for a large local enterprise-style landscape.

Mode: read-only. Do not run Portolan commands, native OSS producers, Docker,
Maven, Gradle, jscpd, Semgrep, or runtime probes. Do not write files.

Target root:

`/home/fall_out_bug/projects/bigtop-landscape`

Fresh Portolan context allowed for this lane:

`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-080-clean-start-artifact-guard/context`

Allowed inputs:

- files inside the fresh context directory above;
- local source files under `/home/fall_out_bug/projects/bigtop-landscape/repos/`
  only if the fresh context explicitly points you there.

Forbidden inputs:

- any sibling `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/*`
  directory other than `20260602-080-clean-start-artifact-guard`;
- `/home/fall_out_bug/projects/bigtop-landscape/run`;
- prior Cursor, OpenCode, consolidated report, PR review, or stress output files;
- any generated Portolan map/context outside the fresh context directory.

If you read or rely on a forbidden input, stop and mark this lane:

`contaminated`

Question set:

1. What is the current context boundary for this lane?
2. Does the fresh context itself tell you to ignore stale sibling stress roots
   and root-level `run/` artifacts?
3. Which artifacts did you read? List exact paths.
4. Did you use any forbidden path? Answer `yes` or `no`.
5. Based only on allowed inputs, what can Portolan claim here about clean-start
   artifact hygiene?
6. What remains `not_assessed`, `cannot_verify`, or `unknown`?

Required output shape:

```markdown
# Cursor Clean-Start Guard Stress

## Lane State

status: verified | contaminated | not_assessed

## Current Boundary

...

## Artifacts Read

...

## Forbidden Path Check

...

## Supported Claim

...

## Unknowns

...
```
