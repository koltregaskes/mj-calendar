# Accessibility Guide

Standard
- Target **WCAG 2.2 AA** with semantic HTML and WAI-ARIA Authoring Practices for interactive parts.
- Focus areas: keyboard navigation, visible focus, labelled form controls, clear status updates, and colour contrast.

Current coverage
- Calendar days are buttons with keyboard arrow navigation and visible focus rings.
- Inputs are paired with labels; status text uses `role="status"` + `aria-live` for screen reader updates.
- Skip link added for quick keyboard jump to the main content.
- Hidden file input is triggered by a labelled button to keep it accessible.

How to test quickly
1) **Keyboard sweep:** Tab through the page, use arrow keys inside the calendar grid, press Enter/Space to pick a day, and toggle tasks.
2) **Automated check (Node required):**
   - cd /workspace/mj-calendar
   - npx @axe-core/cli index.html
3) **Contrast spot-check:** Ensure text stays readable against backgrounds; prefer high-contrast themes when editing styles.

If you change UI components
- Keep controls focusable (`:focus-visible` styling) and labelled.
- Announce dynamic updates with `aria-live` where useful.
- Update this file and README/SETUP if the testing steps change.
