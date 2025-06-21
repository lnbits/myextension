#!/usr/bin/env bash
set -euo pipefail

for pair in "$@"; do
  OLD="${pair%%:*}"
  NEW="${pair##*:}"

  echo "🔁 Replacing $OLD with $NEW..."

  # Replace in filenames
  find . -type f -name "*${OLD}*" | while read -r file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    new_base="${base//$OLD/$NEW}"
    new_path="$dir/$new_base"
    mv "$file" "$new_path"
    echo "Renamed file: $file -> $new_path"
  done

  # Replace in file contents
  find . -type f -print0 | xargs -0 sed -i "s/${OLD}/${NEW}/g"

  # Rename dirs
  find . -depth -type d -name "*${OLD}*" | while read -r dir; do
    parent=$(dirname "$dir")
    base=$(basename "$dir")
    new_base="${base//$OLD/$NEW}"
    new_path="$parent/$new_base"
    mv "$dir" "$new_path"
    echo "Renamed directory: $dir -> $new_path"
  done

done

echo "✅ Done with all replacements."
