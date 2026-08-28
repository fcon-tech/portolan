#!/usr/bin/env bash
# Refresh the hosted demo artifacts from the live provinces, then apply the
# hosting transforms (neutral path, relative room links). Run from repo root:
#   bash docs/demo/refresh.sh
set -eu
BIGTOP=/home/governor/work/datasets/bigtop-landscape
DOGFOOD=/home/governor/projects/faust/portolan-v3
cp docs/landing.html docs/index.html
cp "$BIGTOP/.portolan/chart-room.html" docs/demo/chart-room.html
cp "$BIGTOP/.portolan/fleet-review.html" docs/demo/fleet-review.html
python3 - docs/demo/chart-room.html docs/demo/fleet-review.html <<'PY'
import sys
bigtop="/home/governor/work/datasets/bigtop-landscape"
dogfood="/home/governor/projects/faust/portolan-v3"
p=sys.argv[1]; s=open(p).read().replace(bigtop,"/demo/bigtop-landscape"); open(p,"w").write(s)
p=sys.argv[2]; s=open(p).read()
s=s.replace(f'"file://{bigtop}/.portolan/chart-room.html"','"chart-room.html"')
s=s.replace(f'"file://{dogfood}/.portolan/chart-room.html"','"#"')
s=s.replace("click a group to open its Chart Room. The table below carries the same facts as numbers.",
 "click a group to open its Chart Room. Hosted demo: the bigtop-landscape group is fully linked; the portolan-v3 room stays on the Governor's machine.")
open(p,"w").write(s)
PY
echo "demo refreshed"
