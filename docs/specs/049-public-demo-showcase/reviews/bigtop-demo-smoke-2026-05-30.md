# Apache Bigtop Demo Smoke - 2026-05-30

## Cold-Start Primary Setup Smoke

State: verified for documented primary setup with `apache/bigtop` cloned into
`/tmp`.

Commands:

```bash
rm -rf /tmp/portolan-cold-demo
mkdir -p /tmp/portolan-cold-demo/bigtop-landscape/repos
cd /tmp/portolan-cold-demo/bigtop-landscape/repos
/usr/bin/time -f 'clone_elapsed=%E' git clone --depth 1 https://github.com/apache/bigtop.git apache-bigtop-repo
cd <portolan-checkout>
/usr/bin/time -f 'context_elapsed=%E' go run ./cmd/portolan context prepare --root /tmp/portolan-cold-demo/bigtop-landscape --out /tmp/portolan-cold-demo/output/context --profile cursor
/usr/bin/time -f 'map_elapsed=%E' go run ./cmd/portolan map --root /tmp/portolan-cold-demo/bigtop-landscape --out /tmp/portolan-cold-demo/output/map
go run ./cmd/portolan query gaps --bundle /tmp/portolan-cold-demo/output/map --limit 5
```

Observed:

- clone passed in 0:04.01;
- context pack wrote successfully in 0.07s;
- map bundle wrote successfully in 0.40s;
- bounded gaps query wrote valid JSON.

## Larger Existing-Landscape Smoke

State: verified for local existing Bigtop landscape.

Commands:

```bash
rm -rf /tmp/portolan-demo-bigtop
mkdir -p /tmp/portolan-demo-bigtop
/usr/bin/time -f 'elapsed=%E' go run ./cmd/portolan context prepare --root <bigtop-root> --out /tmp/portolan-demo-bigtop/context --profile cursor
/usr/bin/time -f 'elapsed=%E' go run ./cmd/portolan map --root <bigtop-root> --out /tmp/portolan-demo-bigtop/map
go run ./cmd/portolan query gaps --bundle /tmp/portolan-demo-bigtop/map --limit 5
```

Public redaction note: the actual command used a private local Bigtop root path;
the path is preserved here only as `<bigtop-root>` in public-facing docs and
examples.

Observed:

- context pack wrote successfully in 0.08s;
- map bundle wrote successfully in 2:25.74;
- bounded gaps query wrote valid JSON;
- map bundle contained 18 source-visible repositories, 172243 nodes, 148714
  edges, 555 findings, and 21 coverage records;
- finding states included 430 observed, 118 `not_assessed`, 6
  `cannot_verify`, and 1 `unknown`.

## Publication Boundary

The larger smoke reused an existing local Bigtop landscape. It verifies the
multi-repo excerpt shape, but it does not prove that a fresh public clone of all
Bigtop-related repositories completes under five minutes on every machine.

Full generated outputs are not committed. Public excerpts are redacted under
`docs/test-corpora/apache-bigtop/examples/`.

Redaction procedure: manually replace private root/output prefixes with
`<bigtop-root>` and `<demo-output>`, then run the privacy scan before
publication.
