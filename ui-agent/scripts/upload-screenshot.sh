#!/usr/bin/env bash
# Uploads a PNG screenshot to a dedicated GitHub release and prints the CDN URL.
# Uses a persistent 'ui-screenshots' pre-release as an asset store so the URL
# works in PR markdown without needing the Issues Assets API.
#
# Usage:
#   bash ui-agent/scripts/upload-screenshot.sh path/to/screenshot.png
#
# Requirements:
#   - gh CLI authenticated (gh auth status)
#   - Must be run from inside the repo

set -euo pipefail

FILE="${1:?Usage: upload-screenshot.sh <path-to-image.png>}"

if [[ ! -f "$FILE" ]]; then
  echo "Error: file not found: $FILE" >&2
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
PR_NUMBER=$(gh pr view --json number -q .number 2>/dev/null || echo "")
RELEASE_TAG="ui-screenshots"
BASENAME=$(basename "$FILE")
ASSET_NAME="${PR_NUMBER:+pr${PR_NUMBER}-}${BASENAME}"

# Find or create the ui-screenshots release
RELEASE_ID=$(gh release view "$RELEASE_TAG" --json databaseId --jq .databaseId 2>/dev/null || echo "")

if [[ -z "$RELEASE_ID" ]]; then
  RELEASE_ID=$(gh api --method POST "repos/$REPO/releases" \
    --field tag_name="$RELEASE_TAG" \
    --field name="UI Screenshots" \
    --field body="Asset store for the UI verification agent. Do not delete." \
    --field prerelease=true \
    --jq '.id')
fi

# Delete existing asset with the same name so re-runs replace rather than duplicate
EXISTING_ID=$(gh api "repos/$REPO/releases/$RELEASE_ID/assets" \
  --jq ".[] | select(.name == \"$ASSET_NAME\") | .id" 2>/dev/null || echo "")
if [[ -n "$EXISTING_ID" ]]; then
  gh api --method DELETE "repos/$REPO/releases/assets/$EXISTING_ID" >/dev/null
fi

# Upload and return the download URL
gh api --method POST \
  -H "Content-Type: image/png" \
  --input "$FILE" \
  "https://uploads.github.com/repos/$REPO/releases/$RELEASE_ID/assets?name=$ASSET_NAME" \
  --jq '.browser_download_url'
