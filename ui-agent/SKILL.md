---
name: ui-verification-agent
description: >-
  Verifies UI changes by spinning up a headless browser via playwright-mcp,
  detecting what code changed compared to main, auto-deducing minimal test points,
  capturing screenshots and screen recordings, then auto-creating a PR with
  description and media attached. Use when the user invokes /ui-agent, asks to
  verify UI changes, wants browser screenshots attached to a PR, or needs visual
  evidence that a feature works before merge.
disable-model-invocation: true
---

# UI Verification Agent

Automates visual QA for UI-related changes: detects what changed, deduces minimal
test points, captures screenshots and recordings, and auto-creates a PR with
everything attached.

## Hard Constraints (Never Violate)

1. **Maximum 5 screenshots per run** — if more test points identified, rank and cut.
2. **Never test full E2E flows** — only test the specific component/page affected.
3. **No user intervention** for PR creation — auto-generate title/description from diff.

## Phase 0 — Prerequisites

Before starting, confirm:

- [ ] Dev server running: `npm run dev` on `http://localhost:3000`
- [ ] `gh` CLI authenticated: `gh auth status`
- [ ] `playwright` MCP server available in `.mcp.json`

If any missing, stop and tell the user exactly what's needed.

## Phase 1 — Detect Changes

Gather change information for both test planning AND PR generation:

```bash
# Get current branch and compare against main
BRANCH=$(git branch --show-current)
CHANGED_FILES=$(git diff --name-only main...HEAD)
DIFF_STAT=$(git diff --stat main...HEAD)
DIFF_SUMMARY=$(git diff main...HEAD | head -100)
```

Save these for later (PR description generation).

Also check for existing PR:
```bash
PR_EXISTS=$(gh pr view --json number 2>/dev/null && echo "yes" || echo "no")
PR_NUMBER=$(gh pr view --json number -q .number 2>/dev/null || echo "")
```

## Phase 2 — Map Changes to Minimal Test Points

For each changed file, identify the **single most representative visual state** to capture.
Never test interactions across multiple pages.

| Changed path | Test point (1 screenshot max) |
|-------------|------------------------------|
| `src/app/page.tsx` or `src/components/product/*` | Home product grid render |
| `src/components/product/ProductCard.tsx` | Single product card display |
| `src/components/product/ProductGrid.tsx` | Grid layout with multiple items |
| `src/app/products/[slug]/*` | Product detail page |
| `src/components/cart/*` or `src/app/cart/*` | Cart page state (with items) |
| `src/components/cart/CartItem.tsx` | Individual cart item display |
| `src/app/checkout/*` | Checkout form fields |
| `src/app/auth/*` | Login or register form |
| `src/app/account/*` | Account dashboard |
| `src/app/admin/*` or `src/components/admin/*` | Admin page/widget changed |
| `src/app/layout.tsx` or `src/components/layout/*` | Any page (layout affects all) |
| `src/context/CartContext.tsx` | Cart display component |
| `src/lib/stripe` or `src/lib/supabase` | Checkout or auth pages |

**Rules:**
- If a file matches multiple rows, pick the most specific (deepest path).
- Do NOT test user flows across pages (no "home → product → cart" journeys).
- For product slugs: navigate to `/` first, extract first product slug, then test that detail page.

## Phase 3 — Select Top 5 Screenshots (Priority Ranking)

List all test points identified in Phase 2, then rank by priority:

1. **Critical conversion paths** — cart, checkout (if changed)
2. **New features** — newly added components/pages
3. **High-visibility UI** — layout, navigation, product display
4. **User input areas** — forms, auth
5. **Low-risk styling** — minor CSS tweaks (skip if at cap)

**Cap enforcement:** If more than 5 test points, document what was cut:

```
Selected for verification (5/8):
1. Cart page (CartContext changed)
2. Product detail (slug page changed)
3. Home grid (ProductGrid changed)
4. Checkout form (checkout/page.tsx changed)
5. Login form (auth/login changed)

Skipped (would exceed 5 screenshot cap):
- Product card component (minor styling)
- Admin page (internal tool)
```

## Phase 4 — Execute with Playwright + Recording

For each of the top 5 test points:

1. **Start recording**: `browser_start_recording` (if available) or note limitation
2. `browser_navigate` to URL
3. `browser_wait` for page settle
4. `browser_take_screenshot` → get base64 → decode → save to `ui-agent/screenshots/{name}.png`
5. **If interaction needed** (e.g., form fill, button click for state):
   - `browser_click` or `browser_type`
   - `browser_wait`
   - Another screenshot (counts toward 5 cap)
6. **Stop recording** → save video to `ui-agent/recordings/{name}.webm`

**Screenshot naming:**
- `home-grid.png`
- `product-detail.png`
- `cart-with-items.png`
- `checkout-form.png`
- `login-form.png`

### Handling base64 data

```bash
# Save screenshot
echo "$BASE64_SCREENSHOT" | bash ui-agent/scripts/save-screenshot.sh ui-agent/screenshots/{name}.png

# Save recording (if Playwright provides path, copy; else note limitation)
```

**Console errors**: Use `browser_eval` to capture `window.errors` or console output after each navigation. Log but do not fail on warnings.

## Phase 5 — Auto-Create PR with Media

### Step 5a — Generate PR Content from Diff

Analyze `CHANGED_FILES` and `DIFF_SUMMARY` to generate:

**PR Title template:**
```
{type}: {brief description}

Types based on changes:
- feat: new components, features
- fix: bug fixes
- refactor: code restructuring
- style: UI/styling changes
- chore: config, deps, tooling
```

**PR Body template:**
```markdown
## Summary
{1-2 sentence description of what changed based on file analysis}

## Files Changed
{DIFF_STAT}

### Detailed Changes
{For each significant file, 1-line description of what it does}

## UI Verification
Screenshots and recordings attached below.
```

### Step 5b — Create PR if None Exists

If `PR_EXISTS=no`:

```bash
# Generate title from changed files
PR_TITLE=$(echo "$CHANGED_FILES" | analyze-and-generate-title)

# Create PR
gh pr create \
  --title "$PR_TITLE" \
  --body "$PR_BODY" \
  --base main \
  --head "$BRANCH"

# Get the new PR number
PR_NUMBER=$(gh pr view --json number -q .number)
```

### Step 5c — Upload Screenshots

For each of the up to 5 screenshots:

```bash
CDN_URL=$(bash ui-agent/scripts/upload-screenshot.sh ui-agent/screenshots/{name}.png)
echo "{name}: $CDN_URL"
```

### Step 5d — Upload Recordings (with size check)

For each recording:

```bash
FILE="ui-agent/recordings/{name}.webm"
SIZE_MB=$(du -m "$FILE" | cut -f1)

if [ "$SIZE_MB" -lt 10 ]; then
  VIDEO_URL=$(bash ui-agent/scripts/upload-recording.sh "$FILE")
  echo "Video uploaded: $VIDEO_URL"
else
  echo "Video too large ($SIZE_MB MB), kept local: $FILE"
  VIDEO_URL="local:$FILE"
fi
```

### Step 5e — Update PR Description with Media

Build media section:

```markdown
### Screenshots

| Page/Component | Screenshot |
|---------------|-----------|
| Home Grid | ![home]({cdn_url}) |
| Product Detail | ![product]({cdn_url}) |
| Cart | ![cart]({cdn_url}) |
| Checkout | ![checkout]({cdn_url}) |
| Login | ![login]({cdn_url}) |

### Screen Recordings
- [Home interaction]({video_url_or_local_path})
- [Product detail]({video_url_or_local_path})
...
```

Append to PR:

```bash
EXISTING=$(gh pr view --json body -q .body)
gh pr edit --body "$EXISTING

---

$MEDIA_SECTION"
```

If body too long, use comment:
```bash
gh pr comment --body "$MEDIA_SECTION"
```

### Step 5f — Cleanup

```bash
rm -rf ui-agent/screenshots/ ui-agent/recordings/
```

## Output Format

After completing, summarize in chat:

```
UI Verification complete
- Test points identified: 8
- Screenshots captured (max 5): 5
- Recordings: 3 (2 uploaded, 1 local due to size)
- PR: #42 (auto-created)
- Console errors: 0 warnings, 0 errors

Skipped test points (cap exceeded):
- ProductCard styling tweaks
- Admin dashboard
```

## Additional Resources

- Setup guide: [docs/ui-agent/setup.md](../docs/ui-agent/setup.md)
