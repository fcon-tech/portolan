# Public Demo Excerpt Policy

This directory contains small public-safe excerpts from a local Apache Bigtop
demo run. It does not contain full generated Bigtop outputs.

Before committing excerpts, redact manually:

- replace private machine paths with `<bigtop-root>` and `<demo-output>`;
- keep Bigtop repository directory names only because they are public Apache
  project/component names; for private targets, redact directory names too;
- keep `unknown`, `cannot_verify`, `not_assessed`, `failed`, and `blocked`
  states visible;
- do not include credentials, token-looking values, secret values, private
  customer names, or unsupported service URLs;
- include the generation command and freshness note in the nested demo README;
- run the privacy/freshness scan recorded under the active spec's `reviews/`
  directory.

Generated full outputs may contain absolute local paths. Treat them as local
verification evidence, not public artifacts, unless they receive a separate
privacy review.
