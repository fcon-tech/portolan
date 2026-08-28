#!/usr/bin/env bash
# Refresh the hosted demo artifacts from the live provinces, apply hosting
# transforms (neutral paths, relative room links, favicon), and regenerate
# docs/index.html from docs/landing.html. Run from repo root:
#   bash docs/demo/refresh.sh
set -eu
BIGTOP="$HOME/work/datasets/bigtop-landscape"
DOGFOOD="$HOME/projects/faust/portolan-v3"
NEUTRAL_BIGTOP=/demo/bigtop-landscape
NEUTRAL_DOGFOOD=/demo/portolan-v3

cp docs/landing.html docs/index.html
cp "$BIGTOP/.portolan/chart-room.html" docs/demo/chart-room.html
cp "$BIGTOP/.portolan/fleet-review.html" docs/demo/fleet-review.html

python3 - "$BIGTOP" "$DOGFOOD" "$NEUTRAL_BIGTOP" "$NEUTRAL_DOGFOOD" <<'PY'
import sys
bigtop, dogfood, nb, nd = sys.argv[1:5]
FAV = '<link rel="icon" type="image/svg+xml" href="/favicon.svg">'

def hostify(path, room_rel):
    s = open(path).read()
    # home-path scrub (visible text, JSON, file URLs alike)
    s = s.replace(f"file://{bigtop}", f"file://{nb}")
    s = s.replace(bigtop, nb)
    s = s.replace(f"file://{dogfood}", f"file://{nd}")
    s = s.replace(dogfood, nd)
    # surviving file-scheme links become site-relative or neutralized
    s = s.replace('"file://' + nb + '/.portolan/chart-room.html"', '"chart-room.html"')
    s = s.replace('"file://' + nd + '/.portolan/chart-room.html"', '"#"')
    s = s.replace('"file://' + nb + '"', '"chart-room.html"')
    s = s.replace('"file://' + nd + '"', '"#"')
    s = s.replace("href=\"file://" + nb + '"', 'href="chart-room.html"')
    s = s.replace('href="file://' + nd + '"', 'href="#"')
    # favicon
    if "</title>" in s and FAV not in s:
        s = s.replace("</title>", "</title>\n" + FAV, 1)
    open(path, "w").write(s)

hostify("docs/demo/chart-room.html", "chart-room.html")
hostify("docs/demo/fleet-review.html", "fleet-review.html")
PY
if grep -rn "governor\|/home/" docs/ --exclude=refresh.sh >/dev/null; then echo "LEAK FOUND"; exit 1; fi
echo "demo refreshed, no home paths in docs/"
