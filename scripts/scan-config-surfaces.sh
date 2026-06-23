#!/usr/bin/env bash
# Inventory configuration / contract surfaces under a repo root (no external tools).
# Emits JSONL: {"path":"relative/path","surface_kind":"dockerfile|..."}
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=portolan-ignore.sh
. "$SCRIPT_DIR/portolan-ignore.sh"

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <repo-root> <output.jsonl>" >&2
  exit 2
fi

REPO_ROOT=$(cd "$1" && pwd)
OUT=$2
mkdir -p "$(dirname "$OUT")"
: >"$OUT"

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }

surfaces_tmp=$(mktemp)
trap 'rm -f "$surfaces_tmp"' EXIT

portolan_repo_file_list "$REPO_ROOT" | awk -F/ '
  function emit(kind, path) {
    print kind "\t" path
  }
  {
    path=$0
    base=$NF
    lower=tolower(base)
    if (base == "Dockerfile" || base ~ /^Dockerfile[.]/ || lower ~ /[.]dockerfile$/) emit("dockerfile", path)
    if (base == "docker-compose.yml" || base == "docker-compose.yaml" || base == "compose.yml" || base == "compose.yaml") emit("docker-compose", path)
    if (base == "Chart.yaml") emit("kubernetes", path)
    if (base == ".env" || base ~ /^\.env[.]/ || base ~ /[.]env$/) emit("env-file", path)
    if (base == ".gitlab-ci.yml") emit("ci-workflow", path)
    if (path ~ /(^|[/])[.]github[/]workflows[/][^/]+[.]ya?ml$/) emit("ci-workflow", path)
    if (base ~ /[.]tf$/ || base ~ /[.]tfvars$/) emit("terraform", path)
    if (base == "nginx.conf" || base ~ /[.]nginx[.]conf$/) emit("nginx", path)
    if (base ~ /^(deployment|service|ingress|configmap|kustomization)[.]ya?ml$/) emit("kubernetes", path)
  }
' | sort -u >"$surfaces_tmp"

jq -Rnc '
  inputs
  | split("\t") as $parts
  | select($parts | length == 2)
  | {path:$parts[1], surface_kind:$parts[0]}
' "$surfaces_tmp" >"$OUT"

lines=$(wc -l <"$OUT" | tr -d ' ')
echo "scan-config-surfaces: $lines surfaces -> $OUT" >&2
