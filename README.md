# Altus Vera

Marketing site for **Altus Vera** — AI-enabled technology solutions, where industry excellence meets academic rigor.

A static site: plain HTML, CSS, and vanilla JavaScript with no build step.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy (GitHub Pages)

This repo is the site root, so Pages needs no build step:

1. Push to GitHub.
2. Settings → Pages → Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)`.
3. The site publishes at `https://<user>.github.io/<repo>/`.

## Structure

- `index.html` — the page
- `css/style.css` — design system and styles
- `js/script.js` — scroll reveals, parallax, engagement path, FAQ
- `images/`, `fonts/` — assets
