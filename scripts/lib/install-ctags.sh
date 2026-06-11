#!/usr/bin/env bash
# Install Universal Ctags to a user-writable bin dir (WSL-friendly).
# Source: . "$(dirname "$0")/lib/install-ctags.sh"

portolan_install_ctags() {
  local bindir="${PORTOLAN_TOOL_BIN:-$HOME/.local/bin}"
  mkdir -p "$bindir"

  if command -v ctags >/dev/null 2>&1; then
    ctags --version 2>/dev/null | head -1 >&2 || true
    return 0
  fi

  local candidate
  for candidate in \
    /home/linuxbrew/.linuxbrew/bin/ctags \
    /opt/homebrew/bin/ctags \
    /usr/local/bin/ctags; do
    if [[ -x "$candidate" ]]; then
      ln -sf "$candidate" "$bindir/ctags"
      export PATH="$bindir:$PATH"
      echo "portolan install-ctags: linked $candidate -> $bindir/ctags" >&2
      command -v ctags >/dev/null
      return $?
    fi
  done

  if command -v brew >/dev/null 2>&1; then
    if brew install universal-ctags; then
      command -v ctags >/dev/null && return 0
    fi
  fi

  if command -v apt-get >/dev/null 2>&1; then
  echo "portolan install-ctags: try apt-get install universal-ctags (may need sudo)" >&2
    if apt-get install -y universal-ctags 2>/dev/null || sudo apt-get install -y universal-ctags; then
      command -v ctags >/dev/null && return 0
    fi
  fi

  echo "portolan install-ctags: no install path succeeded (install universal-ctags via brew or apt)" >&2
  return 1
}
