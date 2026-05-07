#!/bin/sh
set -eu

zshrc=1
startup_flags="--tiny --welcome --date --cwd --git --pad-v=1"
custom_startup_flags=0

append_startup_flag() {
  if [ "$custom_startup_flags" -eq 0 ]; then
    startup_flags=""
    custom_startup_flags=1
  fi

  case "$1" in
    *[!A-Za-z0-9_./:=+,%@-]*|'')
      escaped=$(printf "%s" "$1" | sed "s/'/'\\\\''/g")
      formatted="'$escaped'"
      ;;
    *)
      formatted="$1"
      ;;
  esac

  startup_flags="${startup_flags}${startup_flags:+ }$formatted"
}

usage() {
  cat <<'EOF'
Usage: install.sh [options] [clingon-options]

Options:
  --zshrc          Add clingon to ~/.zshrc (default)
  --no-zshrc       Install only, do not edit ~/.zshrc
  -h, --help       Show help

Any other options are written to ~/.zshrc as clingon startup options.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --zshrc)
      zshrc=1
      shift
      ;;
    --no-zshrc)
      zshrc=0
      shift
      ;;
    --)
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      append_startup_flag "$1"
      shift
      ;;
  esac
done

if ! command -v brew >/dev/null 2>&1; then
  echo "install.sh: Homebrew is required: https://brew.sh" >&2
  exit 1
fi

brew install adrianlynch/tap/clingon

if [ "$zshrc" -eq 1 ]; then
  zshrc_file="${ZDOTDIR:-$HOME}/.zshrc"
  startup_line="clingon $startup_flags"

  touch "$zshrc_file"

  if grep -qxF "$startup_line" "$zshrc_file"; then
    echo "clingon is already in $zshrc_file"
  else
    {
      printf '\n'
      printf '%s\n' "$startup_line"
    } >> "$zshrc_file"
    echo "Added clingon to $zshrc_file"
  fi
fi

echo "Installed clingon."
echo "Restart your terminal, or run: source ~/.zshrc"
