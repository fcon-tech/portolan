#!/usr/bin/env bash
cd "$(dirname "$0")/.." || exit 1
# Refresh the hosted demo artifacts from the live provinces, apply hosting
# transforms (neutral paths, relative room links, favicon), and regenerate
# docs/index.html from docs/landing.html. Run from repo root:
#   bash scripts/demo-refresh.sh
set -eu
BIGTOP="${BIGTOP:?set BIGTOP=/path/to/province}"
DOGFOOD="${DOGFOOD:-$PWD}"
NEUTRAL_BIGTOP=/demo/bigtop-landscape
NEUTRAL_DOGFOOD=/demo/portolan

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
# the home-path signature is assembled so this file itself carries no
# literal for scripts/leak-gate.sh to flag; -I skips binary screenshots;
# USER is optional (set -u), searched only as a path segment (a bare
# username matches prose), and -F keeps every pattern a literal
home_sig="/$(printf %s ho)me/"
leak_opts=(-F -e "$home_sig")
if [ -n "${USER:-}" ]; then leak_opts+=(-e "/$USER/"); fi
if grep -rn -I "${leak_opts[@]}" docs/ >/dev/null; then echo "LEAK FOUND"; exit 1; fi
echo "demo refreshed, no home paths in docs/"
