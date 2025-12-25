# Troubleshooting

- **Progress is not saving**: Ensure your browser allows localStorage. Private/incognito modes may clear data on close.
- **A day tile looks empty after ticking**: Refresh once. If it persists, clear cache for this page; the app now rebuilds missing entries before rendering.
- **Import fails**: Confirm the JSON file was exported from this app and not edited manually. The format expects `version`, `tasks`, and `days` keys.
- **Colors look off**: Some high-contrast or night mode extensions may override CSS variables; try disabling them for this page.
- **Keyboard navigation**: Use arrow keys to move between days; press Enter/Space to toggle the selected day.
- **Reset everything**: Use "Clear All" to wipe tasks and progress stored in your browser.
