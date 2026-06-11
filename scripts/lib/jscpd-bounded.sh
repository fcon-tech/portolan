#!/usr/bin/env bash
# Shared bounded jscpd profile (spec 039 / internal/contextprep boundedJSCPDArgs).
# Source: . "$(dirname "$0")/lib/jscpd-bounded.sh"

jscpd_bounded_ignore_globs() {
  echo "${JSCPD_IGNORE_GLOBS:-**/.git/**,**/.portolan/**,**/.codex-subagents/**,**/.cursor/**,**/.agents/**,**/node_modules/**,**/vendor/**,**/build/**,**/dist/**,**/target/**,**/portolan-smoke/**,**/generated/**}"
}

# Run bounded jscpd; targets are path arguments before output_dir (last arg).
# Returns jscpd exit code (124 = timeout).
jscpd_run_bounded() {
  local output_dir=${@: -1}
  local -a targets=("${@:1:$#-1}")
  local ignore code=0
  ignore=$(jscpd_bounded_ignore_globs)
  mkdir -p "$output_dir"
  NODE_OPTIONS="--max-old-space-size=${JSCPD_MEMORY_MB:-2048}" \
    timeout "${SHARD_TIMEOUT:-600}" \
    jscpd "${targets[@]}" \
      --reporters json \
      --absolute \
      --output "$output_dir" \
      --min-lines 50 \
      --min-tokens 100 \
      --max-size 100kb \
      --max-lines 1000 \
      --threshold 999999 \
      --noSymlinks \
      --gitignore \
      --ignore "$ignore" \
      --silent \
      2>>"${FAILURES_LOG:-/dev/null}" || code=$?
  # jscpd omits JSON when zero clones; strict bar needs an empty report.
  if [[ "$code" -eq 0 ]] && ! jscpd_dir_has_report "$output_dir"; then
    printf '%s\n' '{"duplicates":[]}' >"$output_dir/jscpd-report.json"
  fi
  return "$code"
}

# True when output_dir contains a JSON report with a .duplicates array (may be empty).
jscpd_dir_has_report() {
  local dir=$1
  local f
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    jq -e '.duplicates | type == "array"' "$f" >/dev/null 2>&1 && return 0
  done < <(find "$dir" -type f \( -name 'jscpd-report.json' -o -name '*.json' \) 2>/dev/null)
  return 1
}
