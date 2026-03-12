#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-}"

if [[ -z "$TAG" ]]; then
  echo "用法: ./rollback.sh backup-YYYY-MM-DD-HHMMSS"
  exit 1
fi

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "❌ 当前目录不是 git 仓库"; exit 1; }

git fetch --tags
git reset --hard "$TAG"
git push -f origin main

echo "✅ 已回滚到: $TAG"
