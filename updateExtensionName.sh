#!/usr/bin/env bash

# Usage:
#   ./rename-plugin.sh oldname:newname [old2:new2 ...]

set -euo pipefail

# Detect sed flavour
if [[ "$(uname)" == "Darwin" ]]; then
  # macOS / BSD sed
  SED_INPLACE=(-i '')
else
  # Linux / GNU sed
  SED_INPLACE=(-i)
fi

rename_pair() {
  local OLD="$1"
  local NEW="$2"

  echo "🔁 Replacing '$OLD' with '$NEW'..."

  # 1. Rename files containing OLD
  while IFS= read -r -d '' file; do
    dir=$(dirname "$file")
    base=$(basename "$file")
    new_base="${base//$OLD/$NEW}"
    new_path="$dir/$new_base"

    mv "$file" "$new_path"
    echo "Renamed file: $file -> $new_path"
  done < <(
    find . \
      -type f \
      -not -path "*/.git/*" \
      -name "*${OLD}*" \
      -print0
  )

  # 2. Replace OLD inside text file contents
while IFS= read -r -d '' file; do
  # Skip binary files
  if grep -Iq . "$file"; then
    LC_ALL=C sed "${SED_INPLACE[@]}" "s/${OLD}/${NEW}/g" "$file"
  fi
done < <(
  find . \
    -type f \
    -not -path "*/.git/*" \
    -print0
)

  # 3. Rename directories bottom-up
  while IFS= read -r -d '' dir; do
    parent=$(dirname "$dir")
    base=$(basename "$dir")
    new_base="${base//$OLD/$NEW}"
    new_path="$parent/$new_base"

    mv "$dir" "$new_path"
    echo "Renamed directory: $dir -> $new_path"
  done < <(
    find . \
      -depth \
      -type d \
      -not -path "*/.git/*" \
      -name "*${OLD}*" \
      -print0
  )
}

# Main loop
for pair in "$@"; do
  if [[ "$pair" != *:* ]]; then
    echo "❌ Invalid pair: $pair"
    echo "Expected format: oldname:newname"
    exit 1
  fi

  OLD="${pair%%:*}"
  NEW="${pair#*:}"

  rename_pair "$OLD" "$NEW"
done

echo "✅ All done, with .git safely ignored."
