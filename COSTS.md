# Costs

The calendar is a static, in-browser app, so there are no required running costs.

## Ongoing costs
- **Local use:** Free. Everything saves to your browser via localStorage.
- **Static hosting (optional):** Free on most hosts (GitHub Pages, Netlify, Vercel) unless you add custom domains or very high traffic (rare for personal tracking).
- **Backups:** Export/import JSON is manual and free. If you automate backups to cloud storage (e.g., Dropbox/Google Drive), those services may charge if you exceed their free tiers.

## API usage
- **None required.** The app does not call external APIs by default, so there are no API call costs or rate limits to manage.
- **If you add AI/automation later:** Expect token-based billing (e.g., OpenAI per token or Discord bot rate limits). Track estimated calls and set hard limits in your chosen platform to avoid surprises.

## One-time considerations
- **Custom domain (optional):** Typically ~$10–$15/year if you want a branded URL. Not required.
- **SSL certificates:** Free via your host (e.g., Let’s Encrypt on Netlify/Vercel/GitHub Pages).

## How to keep costs low
1) Keep using the local/static model—no servers means no bills.
2) If you introduce APIs, start with low rate limits and alerts in the provider dashboard.
3) Automate exports instead of building a server: a simple scheduled browser automation (or MCP/agent script) can save JSON to cloud storage without hosting costs.
