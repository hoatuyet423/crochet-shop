# UI Agent — Setup Guide

This document covers one-time setup steps that `ui-agent/SKILL.md` assumes are already in place.

## 1. Install the Playwright MCP

The `.mcp.json` at the repo root already includes the entry. No manual install is needed — `npx` fetches it on first use. To verify:

```bash
cat .mcp.json  # should contain a "playwright" entry
```

## 2. Authenticate the GitHub CLI

The upload script and PR attachment steps require `gh` to be authenticated:

```bash
gh auth status        # check current status
gh auth login         # authenticate if needed
```

## 3. Starting the dev server

```bash
npm run dev
```

The app must be reachable at `http://localhost:3000` before invoking the agent.

## 4. Invoking the agent

In a Claude Code session, type:

```
/ui-agent
```

The agent will:
1. Detect what changed compared to `main`
2. Auto-deduce minimal test points (max 5 screenshots)
3. Browse pages headlessly, capture screenshots **and screen recordings**
4. Auto-create a PR with generated description
5. Attach media to the PR (recordings >10MB stay local)

## Temporary Files

During execution, the agent creates:
- `ui-agent/screenshots/*.png` — captured screenshots (up to 5, deleted after upload)
- `ui-agent/recordings/*.webm` — screen recordings (deleted after upload, or kept if >10MB)

These directories are gitignored and cleaned up automatically after the agent runs.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "playwright MCP not found" | Confirm `.mcp.json` has the `playwright` entry and restart your Claude Code session |
| "no open PR found" | The agent auto-creates PRs now. If it fails, push your branch and run `gh pr create` manually |
| Screenshot appears blank or wrong page | Ensure `browser_wait` is used after navigation before capturing |
| Video recording too large | Recordings >10MB are kept local and noted in PR. This is expected for longer recordings |
| Build env vars missing in CI | Add the required secrets to GitHub repo settings (Settings → Secrets → Actions) |
