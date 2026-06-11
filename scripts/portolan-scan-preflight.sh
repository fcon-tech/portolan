#!/usr/bin/env bash
# Preflight required OSS producers before portolan-scan (spec 111).
# Usage: portolan-scan-preflight.sh --producers LIST [--yes] [--skip-install]
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
export PATH="/home/linuxbrew/.linuxbrew/bin:/opt/homebrew/bin:${HOME}/.local/bin:${PATH}"
# shellcheck source=lib/install-ctags.sh
. "$ROOT/scripts/lib/install-ctags.sh"

YES=0
SKIP_INSTALL=0
PRODUCERS="config,jscpd,semgrep,syft,ctags"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) YES=1; shift ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    --producers) PRODUCERS="${2:-}"; shift 2 ;;
    -h|--help)
      echo "usage: $0 [--producers LIST] [--yes] [--skip-install]"
      exit 0
      ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

has_producer() { [[ ",$PRODUCERS," == *",$1,"* ]]; }

require_tool() {
  local tool=$1
  shift
  local -a install_cmds=("$@")
  if command -v "$tool" >/dev/null 2>&1; then
    return 0
  fi
  [[ "$SKIP_INSTALL" -eq 1 ]] && return 1
  for c in "${install_cmds[@]}"; do
    if eval "$c"; then
      command -v "$tool" >/dev/null && return 0
    fi
  done
  return 1
}

fail=0

if has_producer jscpd; then
  require_tool jscpd "npm install -g jscpd" "brew install jscpd" || fail=1
fi
if has_producer semgrep; then
  require_tool semgrep "pipx install semgrep" "brew install semgrep" || fail=1
fi
if has_producer syft; then
  require_tool syft \
    "brew install syft" \
    "curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b $HOME/.local/bin" || fail=1
fi
if has_producer ctags; then
  require_tool ctags "portolan_install_ctags" "brew install universal-ctags" || fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "portolan-scan-preflight: required producer tool(s) missing after install attempts" >&2
  if [[ "$YES" -eq 1 ]]; then
    exit 2
  fi
  exit 1
fi

echo "portolan-scan-preflight: ok (producers: $PRODUCERS)" >&2
