# Setup

1. Download or clone the repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari). No server is required.
3. Ensure localStorage is enabled; the app saves progress automatically in your browser.
4. If the browser blocks local files, serve locally:
   - cd /workspace/mj-calendar
   - python -m http.server 8000
   - open http://localhost:8000
5. Optional accessibility check (requires Node/npm):
   - cd /workspace/mj-calendar
   - npx @axe-core/cli index.html
6. No secrets are needed. If you add tokens later, copy `.env.example` to `.env` and keep real values out of commits.

You can host the folder on GitHub Pages, Netlify, or Vercel for a live URL; the app is static and needs no backend.
