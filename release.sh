#!/usr/bin/env bash
set -euo pipefail

MSG="${1:-chore: release}"
TAG="backup-$(date +%F-%H%M%S)"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "❌ 当前目录不是 git 仓库"; exit 1; }

# 如果没有变更，也允许打包发布（仅打 tag + push）
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add .
  git commit -m "$MSG"
else
  echo "ℹ️ 没有代码变更，跳过 commit"
fi

git tag "$TAG"
git push origin main --tags

echo "✅ 发布完成"
echo "📌 存档标签: $TAG"
