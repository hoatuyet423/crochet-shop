#!/usr/bin/env bash
# Saves a base64-encoded screenshot to disk.
#
# Usage:
#   echo "$BASE64_DATA" | bash ui-agent/scripts/save-screenshot.sh path/to/output.png
#
# Requirements:
#   - base64 utility (available on macOS, Linux, Windows Git Bash)

set -euo pipefail

OUTPUT="${1:?Usage: save-screenshot.sh <output-path>}"

# Ensure directory exists
mkdir -p "$(dirname "$OUTPUT")"

# Read base64 from stdin and decode to file
cat | base64 -d > "$OUTPUT"

echo "Saved: $OUTPUT"
