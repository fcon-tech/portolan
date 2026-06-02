# Cursor Composer 2.5 Stress Prompt: jscpd Sharded Plan

You are Cursor Agent Composer 2.5 evaluating Portolan as a local-first
navigation harness for Apache Bigtop.

Target root:

`/home/fall_out_bug/projects/bigtop-landscape`

Allowed Portolan context for this lane:

`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-079-jscpd-sharded-plan/context`

Allowed reads:

- files directly under the allowed context directory above;
- paths named inside those context files only as metadata references.

Forbidden reads for this lane:

- sibling `.portolan/stress/*` roots;
- root-level `run/`;
- generated Portolan map bundles outside the allowed context;
- root `.portolan/producer-runs.jsonl`;
- repository source files under `repos/`;
- any jscpd output outside the allowed context.

Forbidden actions:

- do not run jscpd or any other native OSS producer;
- do not install tools;
- do not create, edit, delete, or move files in the Bigtop target.

Task:

Evaluate whether this Portolan context gives an agent adequate next actions for
the prior full-root jscpd OOM gap without overclaiming duplication evidence.

Answer with these sections:

1. Lane State: `verified`, `failed`, or `contaminated`.
2. Artifacts Read: exact paths read.
3. Forbidden Path Check: `yes` or `no`, with evidence.
4. jscpd Plan Assessment:
   - whether the jscpd plan is present;
   - its `status` and `evidence_state`;
   - command count;
   - whether commands are repository-sharded or full-root;
   - whether writes stay under the current context `tool-outputs`;
   - whether failed/missing/unrun shards remain non-counting evidence.
5. Supported Claims: what can be claimed from the allowed context only.
6. Unsupported Claims: what must remain `not_assessed`, `cannot_verify`, or
   `unknown`.
7. Product Verdict: whether this is an adequate navigation-harness improvement
   for the duplication/OOM gap, or what exact gap remains.
