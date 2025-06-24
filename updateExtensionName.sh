#!/usr/bin/env bash

# Usage: ./rename-plugin.sh oldname:newname [old2:new2 ...]

set -euo pipefail

# Function to rename files, contents, and directories
rename_pair() {
  local OLD="$1"
  local NEW="$2"

  echo "🔁 Replacing '$OLD' with '$NEW'..."

  # 1. Rename files with OLD in the name
  find . -type f -not -path "*/.git/*" -name "*${OLD}*" | while read -r file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    new_base="${base//$OLD/$NEW}"
    new_path="$dir/$new_base"
    mv "$file" "$new_path"
    echo "Renamed file: $file -> $new_path"
  done

  # 2. Replace inside file content
  find . -type f -not -path "*/.git/*" -print0 | xargs -0 sed -i "s/${OLD}/${NEW}/g"

  # 3. Rename directories (bottom-up)
  find . -depth -type d -not -path "*/.git/*" -name "*${OLD}*" | while read -r dir; do
    parent=$(dirname "$dir")
    base=$(basename "$dir")
    new_base="${base//$OLD/$NEW}"
    new_path="$parent/$new_base"
    mv "$dir" "$new_path"
    echo "Renamed directory: $dir -> $new_path"
  done
}

# Main loop over all name pairs
for pair in "$@"; do
  OLD="${pair%%:*}"
  NEW="${pair##*:}"
  rename_pair "$OLD" "$NEW"
done

echo "✅ All done, with .git folder safely ignored."
