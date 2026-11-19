# HELIOS SYSTEMS — corporate website

Static institutional website for **HELIOS SYSTEMS**: Building the Intelligence
Architecture of the Digital Age. *Fast, Smart & Limitless.*

Built on the original front-end design foundation: plain HTML, CSS and
JavaScript, with no framework, build step or database required to run.

See `TRANSFORMATION_REPORT.md` for the full page mapping, testing results and
remaining configuration items.

## Run locally

All pages use absolute root paths (`/css/...`, `/js/...`, `/images/...`), so
serve the folder itself as the document root:

```bash
cd ~/Downloads/stack18-site
python3 -m http.server 8000
```

Open <http://localhost:8000/>.

## Structure

| Path | Purpose |
|---|---|
| `/` | Institutional homepage |
| `/about`, `/our-story`, `/vision-mission`, `/philosophy` | Corporate identity |
| `/organisation`, `/leadership`, `/team` | Structure and people |
| `/divisions` | Six-division architecture |
| `/cybersecurity`, `/cybersecurity/*` | Division 01 and category pages |
| `/services`, `/services/*` | 26 operational services |
| `/intelligence`, `/intelligence/*` | Division 02 |
| `/academy`, `/academy/*` | Helios Academy (live) |
| `/big-sam-academy`, `/big-sam-academy/*` | Division 04 |
| `/software-systems`, `/software-systems/*` | Division 05 |
| `/platforms`, `/platforms/*` | NeuroBridge, NeuroMap, Phantom Eye, Noctalon, Nexus, Academy platforms |
| `/consulting`, `/consulting/*` | Division 06 |
| `/industries`, `/industries/*` | Sector application |
| `/research`, `/research/whitepaper`, `/research/agenda` | Research and official whitepaper |
| `/insights`, `/insights/*` | Editorial briefings |
| `/newsroom`, `/events`, `/resources`, `/glossary` | News, events, resources, knowledge centre |
| `/contact`, `/careers`, `/partnerships`, `/legal`, `/privacy-policy`, `/terms-of-service`, `/security` | Engagement and policies |
| `/sitemap` | Complete HTML sitemap |

## Configuration

Central configuration lives in `js/site.config.js`:

- `domain` — official production domain (empty until confirmed)
- `companyEmail`, `phone`, `officeAddress` — official contact details
- `social` — official profiles
- `academyPortalUrl`, `bigSamAcademyPortalUrl` — future portal URLs
- `contactEndpoint`, `newsletterEndpoint` — form delivery endpoints

Empty values are handled deliberately: portal links fall back to local
coming-soon pages, contact details are not fabricated, and forms explicitly
state that nothing was sent when no endpoint is configured. When the domain is
set, run `python3 tools/build_sitemap.py` to generate `sitemap.xml` with
absolute URLs.

## Deployment note

The original legacy pages that are not part of the HELIOS architecture were
moved, not deleted, to:

`~/Downloads/stack18-legacy-pages/`

They remain available for reference and recovery outside this website root.

## Content status

- Helios Academy is live; VERITAS Cohort 1 (Digital Forensics) runs 12 October
  to 5 December 2026, free of charge, with over 100 registrations.
- Ethical Hacking and Cloud Security are defined specialisations with cohort
  dates to be announced.
- NeuroBridge, Phantom Eye, Noctalon, Nexus and the Big Sam Academy Platform are
  in development; NeuroMap is under refinement; the Helios Academy Platform is
  in use for Academy delivery.
- No production domain, company email or telephone is yet confirmed.

## Design

- `css/style.css` — original core design system
- `css/company.css` — homepage components
- `css/nav.css` — mega-menu
- `css/pages-plus.css`, `css/skin.css` — existing page blocks and interactions
- `css/helios.css` — HELIOS hybrid identity layer (official palette)
- `js/nav.js`, `js/skin.js`, `js/company.js`, `js/main.js` — existing interactions
- `js/site.config.js`, `js/helios.js` — configuration and honest form handling

## Content policy

Development-stage capabilities are labelled. No client relationships,
certifications, press coverage, personnel or contact details are fabricated.
Where a fact is not confirmed, the site says so.
