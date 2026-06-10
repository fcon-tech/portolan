#!/usr/bin/env bash
# Inventory configuration / contract surfaces under a repo root (no external tools).
# Emits JSONL: {"path":"relative/path","surface_kind":"dockerfile|..."}
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=orient-ignore.sh
. "$SCRIPT_DIR/orient-ignore.sh"

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <repo-root> <output.jsonl>" >&2
  exit 2
fi

REPO_ROOT=$(cd "$1" && pwd)
OUT=$2
mkdir -p "$(dirname "$OUT")"
: >"$OUT"

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }

append_surface() {
  local kind=$1 path=$2
  [[ -z "$path" ]] && return 0
  local rel
  rel="${path#"$REPO_ROOT"/}"
  [[ "$rel" == "$path" && "$path" != "$REPO_ROOT"/* ]] && return 0
  orient_rel_path_is_ignored "$REPO_ROOT" "$rel" && return 0
  jq -nc --arg path "$rel" --arg surface_kind "$kind" \
    '{path:$path,surface_kind:$surface_kind}' >>"$OUT"
}

scan_glob() {
  local kind=$1 pattern=$2
  local f
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    append_surface "$kind" "$f"
  done < <(find -P "$REPO_ROOT" -type f \
    \( -path '*/.git/*' -o -path '*/node_modules/*' -o -path '*/vendor/*' \) -prune \
    -o -type f -name "$pattern" -print 2>/dev/null)
}

scan_glob dockerfile 'Dockerfile'
scan_glob dockerfile 'Dockerfile.*'
scan_glob dockerfile '*.dockerfile'
scan_glob docker-compose 'docker-compose.yml'
scan_glob docker-compose 'docker-compose.yaml'
scan_glob docker-compose 'compose.yml'
scan_glob docker-compose 'compose.yaml'
scan_glob kubernetes 'Chart.yaml'
scan_glob env-file '.env'
scan_glob env-file '.env.*'
scan_glob env-file '*.env'
while IFS= read -r f; do
  [[ -f "$f" ]] || continue
  append_surface ci-workflow "$f"
done < <(find -P "$REPO_ROOT" -type f \
  \( -path '*/.git/*' -o -path '*/node_modules/*' -o -path '*/vendor/*' \) -prune \
  -o -type f \( -path '*/.github/workflows/*.yml' -o -path '*/.github/workflows/*.yaml' -o -name '.gitlab-ci.yml' \) -print 2>/dev/null)
scan_glob terraform '*.tf'
scan_glob terraform '*.tfvars'
scan_glob nginx 'nginx.conf'
scan_glob nginx '*.nginx.conf'

# k8s manifests by filename heuristic
while IFS= read -r f; do
  [[ -f "$f" ]] || continue
  base=$(basename "$f")
  case "$base" in
    deployment.yaml|deployment.yml|service.yaml|service.yml|ingress.yaml|ingress.yml|configmap.yaml|configmap.yml|kustomization.yaml|kustomization.yml)
      append_surface kubernetes "$f"
      ;;
  esac
done < <(find -P "$REPO_ROOT" -type f \( -name '*.yaml' -o -name '*.yml' \) \
  \( -path '*/.git/*' -o -path '*/node_modules/*' \) -prune -o -type f -print 2>/dev/null)

sort -u -o "$OUT" "$OUT" 2>/dev/null || true
lines=$(wc -l <"$OUT" | tr -d ' ')
echo "scan-config-surfaces: $lines surfaces -> $OUT" >&2
