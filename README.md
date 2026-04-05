# Midjourney Review Calendar

A local-first daily checklist tool for tracking your Midjourney production workflow.

This is designed around the way you work in batches across each day, rather than as a generic calendar app.

## Core Workflow

The default checklist is built around the main stages of your image pipeline:

1. Review images
2. Videos
3. Upscales
4. Publish

You can also add extra reusable task presets if another recurring stage becomes part of the workflow.

## What It Already Does

- Day-by-day checklist tracking with visible progress
- Built-in default workflow for Review images, Videos, Upscales, and Publish
- Add and delete reusable task presets
- Add a short note to any day for reminders, blockers, or batch context
- Reset just the selected day or clear the whole calendar
- Restore the standard workflow at any time if experiments get messy
- Jump to any month or exact date
- Import and export JSON backups
- Save everything locally in the browser with no backend
- Install as a lightweight PWA on desktop or Android

## Why This Repo Matters

This is a strong candidate for eventual migration into the Agent Workspace 2 hub system because the workflow is already clear and the tool surface is small.

## Running It

1. Open [index.html](index.html) in a modern browser.
2. Pick a day.
3. Tick off the Midjourney work you completed.
4. Add extra presets only if your process changes.

## Key Files

- `index.html` - app shell
- `app.js` - checklist logic, storage, import, and export
- `style.css` - UI styling
- `SETUP.md` - quick setup notes
- `USAGE.md` - how to use it day to day
- `TROUBLESHOOTING.md` - common fixes
