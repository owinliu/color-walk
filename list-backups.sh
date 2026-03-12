#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "可回滚存档（新→旧）："
git fetch --tags >/dev/null 2>&1 || true
git tag --list 'backup-*' --sort=-creatordate | nl -w2 -s'. '
