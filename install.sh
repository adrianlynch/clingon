#!/bin/sh
set -eu

zshrc=1
size="tiny"
startup_flags="--welcome --date --cwd --git --pad-v=1"

usage() {
  cat <<'EOF'
Usage: install.sh [options]

Options:
  --zshrc          Add clingon to ~/.zshrc (default)
  --no-zshrc       Install only, do not edit ~/.zshrc
  --size <size>    Startup size: tiny, small, normal, or large
  --size=<size>    Startup size: tiny, small, normal, or large
  -h, --help       Show help
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
    --size)
      if [ "$#" -lt 2 ]; then
        echo "install.sh: --size requires a value" >&2
        exit 1
      fi
      size="$2"
      shift 2
      ;;
    --size=*)
      size="${1#--size=}"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "install.sh: unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

case "$size" in
  tiny|small|normal|large) ;;
  *)
    echo "install.sh: invalid size: $size" >&2
    echo "install.sh: expected tiny, small, normal, or large" >&2
    exit 1
    ;;
esac

if ! command -v brew >/dev/null 2>&1; then
  echo "install.sh: Homebrew is required: https://brew.sh" >&2
  exit 1
fi

brew install adrianlynch/tap/clingon

if [ "$zshrc" -eq 1 ]; then
  zshrc_file="${ZDOTDIR:-$HOME}/.zshrc"
  startup_line="clingon --size $size $startup_flags"

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
