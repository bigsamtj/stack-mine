# Stack18 — front-end mirror

Static front-end snapshot of **https://www.stack18.com/**, mirrored on **2026-11-18**.

This is the site's original HTML, CSS, JavaScript, fonts and local images — no
backend, database, build system or framework bundle. The site is a hand-built
multi-page static site (server-rendered HTML, plain CSS and plain JS); there is
no React/Next/Vue/Angular app here.

## Run it

All pages use absolute root paths (`/css/...`, `/js/...`, `/images/...`), so the
folder must be served from its root. Opening `index.html` directly with
`file://` will not load the styles or scripts.

```bash
cd ~/Downloads/stack18-site
python3 -m http.server 8000
```

Then open: <http://localhost:8000/>

Any static server works (nginx, Caddy, `npx serve`, etc.), as long as this
directory is the document root.

## Contents

| Item | Count | Notes |
|---|---:|---|
| HTML pages | 3,340 | All 3,339 sitemap URLs + `/marketplace/search` |
| CSS files | 18 | `css/*.css` |
| JavaScript files | 17 | `js/*.js` |
| Fonts | 3 | Inter + Lora (WOFF2) in `fonts/` |
| Local images | 3,349 | Logos, art, team photos, per-page OG images in `images/` |
| Other | 4 | `robots.txt`, `sitemap.xml`, `site.webmanifest`, favicons |
| **Total** | **6,731 site files** | **~339 MiB** (+ this README) |

URLs are stored as directory indexes, matching the live site's extensionless
URLs:

```
/about                 -> about/index.html
/services/web-development -> services/web-development/index.html
/                       -> index.html
```

Asset links still carry the original cache-busting query strings
(`/css/style.css?v=20261112d`). Assets are stored without the query string;
normal static servers ignore it and serve the file correctly.

## Key files

- `css/style.css` — core design system / global layout (largest stylesheet)
- `css/nav.css`, `css/pages-plus.css`, `css/skin.css` — navigation, page blocks, theme
- `css/company.css`, `css/marketplace.css`, `css/glossary.css`, etc. — page-specific styles
- `js/main.js`, `js/nav.js`, `js/skin.js` — core interactions, nav, light/dark theme
- `js/picker.js`, `js/lead-popup.js`, `js/s18-chat.js` — interactive widgets
- `js/marketplace.js`, `js/glossary.js`, `js/listing.js`, etc. — page-specific behaviour

## What is intentionally missing

Backend and private paths excluded in line with `robots.txt`:

- `/contact-handler.php` — contact form submit handler
- `/chat-handler.php`, `/chat/` — "Ask Sia" chat
- `/marketplace-data/` — marketplace search/filter data
- `/crm/`, `/tools/`

As a result, locally the contact forms, chat widget, and marketplace search/filter
will not complete requests. The pages themselves and all local styling/scripts
are intact.

External resources are still hot-linked (as on the live site):

- `www.googletagmanager.com` — Google Analytics/GTM
- `img.logo.dev` — vendor logos on marketplace pages
- `images.unsplash.com` — hero/photography images
- LinkedIn, Instagram, WhatsApp links

Without internet access those remote images/scripts will not load, but the local
layout and navigation still work.

## Verification performed

- 3,339/3,339 sitemap pages present, plus `/marketplace/search`
- 65,204 local asset references checked — **0 missing**
- 836,748 internal page links checked — **0 missing**
- 0 unresolved CSS `url()` / `@import` references
- Homepage, `/about/`, a marketplace profile and `/marketplace/search` rendered in
  headless Chromium against a local static server; CSS, JS, fonts and local images
  all loaded

## Note

The code and content are © Stack18. This copy was made for local reference and
analysis of the site's front-end. Don't redeploy or republish it as your own.
