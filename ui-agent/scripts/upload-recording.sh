#!/usr/bin/env bash
# Uploads a video recording to GitHub PR assets, with size fallback.
#
# Usage:
#   bash ui-agent/scripts/upload-recording.sh path/to/recording.webm
#
# Returns:
#   - CDN URL if uploaded successfully
#   - "FILE_TOO_LARGE:path" if file exceeds 10MB
#   - Error message and exit 1 on other failures
#
# Requirements:
#   - gh CLI authenticated
#   - Must be run from inside the repo with an open PR on the current branch

set -euo pipefail

FILE="${1:?Usage: upload-recording.sh <path-to-video.webm>}"

if [[ ! -f "$FILE" ]]; then
  echo "Error: file not found: $FILE" >&2
  exit 1
fi

# Check file size (10MB cap)
SIZE_MB=$(du -m "$FILE" | cut -f1)

if [[ "$SIZE_MB" -ge 10 ]]; then
  echo "FILE_TOO_LARGE:$FILE"
  exit 0
fi

FILENAME=$(basename "$FILE")
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
PR_NUMBER=$(gh pr view --json number -q .number 2>/dev/null || echo "")

if [[ -z "$PR_NUMBER" ]]; then
  echo "Error: no open PR found for the current branch." >&2
  echo "       Push your branch and open a PR first, or run: gh pr create" >&2
  exit 1
fi

# Determine content type based on extension
EXT="${FILENAME##*.}"
CONTENT_TYPE="video/webm"
case "$EXT" in
  mp4) CONTENT_TYPE="video/mp4" ;;
  mov) CONTENT_TYPE="video/quicktime" ;;
  webm) CONTENT_TYPE="video/webm" ;;
esac

CDN_URL=$(gh api \
  --method POST \
  -H "Content-Type: $CONTENT_TYPE" \
  --input "$FILE" \
  "repos/$REPO/issues/$PR_NUMBER/assets?name=$FILENAME" \
  --jq '.url')

echo "$CDN_URL"
