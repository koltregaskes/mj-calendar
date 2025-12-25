# Architecture

The app is a lightweight, client-only single-page experience:

- **Static assets**: `index.html`, `style.css`, and `app.js` loaded directly in the browser. No backend.
- **Core class**: `MidjourneyCalendar` in `app.js` handles state, rendering, storage, and events.
- **Data model**:
  - `tasks`: array of task definitions `{ id, label }` persisted under `localStorage["mj-calendar:tasks"]`.
  - `days`: object keyed by `YYYY-MM-DD`, each with `tasks` map `{ [taskId]: boolean }` under `localStorage["mj-calendar:days"]`.
  - Export/import uses `{ version, tasks, days }` JSON to keep structure intact.
- **State flow**:
  1. Load tasks + day data from `localStorage`, falling back to defaults.
  2. Render calendar grid for the visible month with per-day progress colors derived from task completion percentage.
  3. Selecting a day updates the task panel; toggling a checkbox writes to memory and `localStorage`, then re-renders.
- **Visual logic**: Each day button sets CSS variables for hue (red→green), lightness, and border lightness. Inline bars + mini task dots show partial vs. complete progress at a glance.
- **Styling**: Pure CSS with CSS variables for light/neon palette, responsive layout, and animation cues for focus/selection.
- **Accessibility**: Semantic controls, keyboard navigation inside the grid, and `aria` labels for interactive elements.
- **AI-first readiness**: Code is organized for future AI agents (e.g., MCP/Skills/llm.tst) to read/modify easily: clear data boundaries, exported JSON schema, and documented storage keys ready for agent pipelines.
