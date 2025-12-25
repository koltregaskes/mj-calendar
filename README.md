# Midjourney Review Calendar

A simple web calendar to track your daily Midjourney workflow across multiple tasks (images, videos, publishing, and any extras). It runs locally in your browser, saves progress automatically, and keeps your data private.

## What you get
- Modern calendar UI tuned for daily task checklists.
- Color-coded progress per day (red when empty → amber as you tick → green on completion) plus mini dots for each task.
- Automatic saving in your browser the moment you tick a box (no server required).
- Import/export JSON backups.
- Manageable task list with defaults for Midjourney routines.
- Reload-safe tiles that keep your ticks visible every time you reopen the page.
- 2026-ready visuals with keyboard support, responsive layout, and AI-ready JSON structure (MCP/skills friendly).

## AI-ready by design
- Clear JSON schema for MCP/agent pipelines and llm-friendly audits.
- Simple file layout so AI tools (skills, tests, or assistants) can extend tasks or automate publishing flows.

See [USAGE.md](USAGE.md) for quick steps, [SETUP.md](SETUP.md) for running the page, and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if you hit issues. AI helpers should start with [AGENTS.md](AGENTS.md) and [llms.txt](llms.txt). Accessibility details live in [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Costs in plain English
- Running locally: **free**. Everything saves in your browser.
- Hosting (optional): **usually free** on GitHub Pages/Netlify/Vercel unless you add a paid domain.
- APIs: **none required** today. If you add AI/automation later, check [COSTS.md](COSTS.md) for rough ranges and safe limits.

## How to Get Started
1) **Download the folder** (or clone the repo) to your computer.
2) **Open `index.html` in your browser.** That’s it—no installs or servers needed.
3) **Saving happens automatically in your browser.** Your ticks stay even after closing the tab.
4) **No API keys or secrets required today.** If you add one later (for example, a Midjourney or Discord bot token), keep it in a private `.env` file (see `.env.example`) and never commit it.
5) **Optional quick local server (if the browser blocks local files):**
   - cd /workspace/mj-calendar
   - python -m http.server 8000
   - open http://localhost:8000 in your browser
6) **Optional accessibility check (Node/npm needed):**
   - cd /workspace/mj-calendar
   - npx @axe-core/cli index.html
7) **Want it online?** Host these files on any static host (GitHub Pages, Netlify, Vercel, etc.) and visit the provided URL; the app runs fully in the browser.
