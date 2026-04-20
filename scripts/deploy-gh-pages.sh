#!/usr/bin/env bash
set -euo pipefail

remote="${REMOTE:-origin}"
branch="${DEPLOY_BRANCH:-gh-pages}"
base_path="${VITE_BASE_PATH:-/}"
build_dir="${BUILD_DIR:-dist}"
message="${COMMIT_MESSAGE:-Deploy GitHub Pages}"

remote_url="$(git remote get-url "$remote")"
tmp_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

VITE_BASE_PATH="$base_path" npm run build
cp "$build_dir/index.html" "$build_dir/404.html"

cp -a "$build_dir"/. "$tmp_dir"/
touch "$tmp_dir/.nojekyll"

git -C "$tmp_dir" init -b "$branch" >/dev/null
git -C "$tmp_dir" add -A
git -C "$tmp_dir" commit -m "$message"
git -C "$tmp_dir" remote add "$remote" "$remote_url"
git -C "$tmp_dir" push --force "$remote" "HEAD:$branch"

echo "Published $build_dir to $remote/$branch with base path $base_path"
