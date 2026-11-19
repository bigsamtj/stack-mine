# HELIOS SYSTEMS — Website Transformation Report

**Project:** Complete institutional transformation of the Stack18 website  
**Target organisation:** HELIOS SYSTEMS  
**Positioning:** Building the Intelligence Architecture of the Digital Age  
**Mantra:** Fast, Smart & Limitless.  
**Date:** 19 November 2026  
**Working directory:** `/home/kali/Downloads/stack18-site`  
**Status:** Complete, tested and ready for domain configuration

---

## 1. Executive summary

The original Stack18 mirror contained **3,340 HTML pages** built on a hand-coded static HTML/CSS/JavaScript design system. It has been transformed into the complete corporate website of **HELIOS SYSTEMS**, organised around the six official divisions, two distinct academies, the subsidiary platform ecosystem, research, sectors and advisory capability.

The existing design foundation has been retained. The site still runs on the original front-end architecture:

- the same static HTML / plain CSS / plain JavaScript approach;
- the original container, grid, hero, section, card, button, navigation, footer and animation systems;
- the existing `style.css`, `nav.css`, `company.css`, `pages-plus.css` and `skin.css`;
- the existing `nav.js`, `skin.js`, `company.js` and `main.js` behaviours, with Stack18-specific widgets removed.

A new HELIOS design layer (`css/helios.css`) applies the hybrid light/dark visual identity, the official palette and the institutional components. **No React, Next.js or unrelated framework was introduced.**

Final site: **162 fully populated pages**, **204 files**, approximately **13 MB** excluding `.git`.

All non-HELIOS legacy material was **moved, not deleted**, to `/home/kali/Downloads/stack18-legacy-pages` (365 MB, 6,727 files).

---

## 2. Source materials and safety

### Source documents
- Original site mirror: `/home/kali/Downloads/stack18-site`
- Official whitepaper: `/home/kali/Downloads/HELIOS_SYSTEMS_Whitepaper_v3.pdf` (18 pages, v3.0, 2026, Samuel Tijesunimi Adeyinka)
- Official emblem: extracted from the whitepaper PDF with `pdfimages` (1,254 × 1,254 px source)

### Safety measures
- **Pre-change tar backup:** `/home/kali/Downloads/stack18-site-backup-before-helios-2026-11-19.tar.gz` (208 MB)
- **Git baseline:** commit `1669dc88a7cc151c6f7d8a1224a6f98bd6cd922c`, branch `main`, clean at the start
- **Legacy archive:** `/home/kali/Downloads/stack18-legacy-pages/` — original pages, CSS, JS, images, sitemap, robots, README and `.well-known`, preserved outside the website root
- **Recovery:** restore any item from the archive or extract the tar backup; the original homepage is at `stack18-legacy-pages/root/index.html`

No Git commit was created as part of this work.

---

## 3. Reconnaissance findings

| Property | Original finding |
|---|---|
| Technology | Hand-built static HTML, 18 CSS files, 17 JS files, no framework, no build step |
| HTML pages | 3,340 |
| Sitemap URLs | 3,339 |
| Image assets | 3,346 local files plus hot-linked Unsplash photography |
| Fonts | Inter and Lora (WOFF2) |
| Page families | marketplace (2,940), capabilities (256), glossary (56), services (31), industries (10), solutions (7), resources (5), compare (5), plus corporate and legal pages |
| Shared components | Sticky header, accessible mega-menu, mobile navigation, footer accordions, cards, heroes, jumps, FAQ accordions, reveal/spotlight animations |
| Brand | Stack18, Jaipur, amber accent, India-specific pricing and programme content |
| Analytics / widgets | Google Analytics, WhatsApp float, AI chat widget, lead popup, picker |

**Key judgement:** 2,940 marketplace listings, 256 programmatic capability pages and the Stack18 solutions/comparisons are inherently tied to another company's clients, products and geographic SEO. Retaining them would have required fabricated HELIOS claims. They are archived, while the valuable layout patterns, service template, solution/platform template, industry template, glossary template and design system are retained and reused.

---

## 4. Page mapping

| Original Stack18 family | Original pages | HELIOS treatment |
|---|---:|---|
| Homepage | 1 | Rebuilt as the institutional HELIOS entry point using the preserved `cw-*`/`hm2` layout and section architecture |
| About, Our Story, Leadership, Locations, Culture, Careers, How We Work, Contact, Partnerships, Legal, Privacy, Terms, Security | 16 | Fully rewritten for HELIOS; leadership presented honestly with confirmed and open roles |
| Services (`/services/*`) | 31 | Replaced with **26 HELIOS security services** plus a cross-division service index; the original service-detail layout is reused |
| Solutions (six Stack18 OS products) | 7 | Replaced with **7 HELIOS platforms** plus a platform hub; the solution-detail layout is adapted to platform showcases |
| Industries | 10 | **9 HELIOS sectors** plus index, using the original industry-page layout |
| Capabilities (programmatic SEO) | 256 | Archived; capability coverage distributed across division and service pages instead of cloned filler |
| Marketplace (third-party software listings) | 2,940 | Archived; HELIOS has a specialised platform ecosystem, not a marketplace of third-party tools |
| Glossary | 56 | Rebuilt as a **33-term HELIOS Knowledge Centre** with a new hub and individual definitions |
| Compare / decision guides | 5 | Archived; decision guidance is folded into How We Work, Insights and service pages |
| Case studies | 3 | Archived; no client outcomes are invented. Replaced by Insights and capability briefings |
| Resources / newsroom / events | 7 | Rebuilt as Research, Whitepaper, Insights, Newsroom, Events and the Knowledge Centre |
| Stack School | 1 | Replaced by **Helios Academy** and **Big Sam Academy** |
| Stack Ventures, Stack Capital, Stack Connect, Stack Gives, Referral Programme, Pricing, Enterprise, Agentic SDLC, What is Stack18 | 10+ | Archived; these are not part of the HELIOS whitepaper and would have required unrelated or fabricated content |
| Design system files | — | Core CSS, JS and fonts preserved; obsolete page-specific CSS/JS archived; new HELIOS layer and configuration scripts added |

---

## 5. Final architecture — 162 pages

| Area | Pages | Contents |
|---|---:|---|
| Corporate core | 24 | Home, About, Our Story, Vision & Mission, Philosophy, Organisation, Leadership, Team, What is HELIOS, How We Work, Culture, Careers, Locations, Contact, Partnerships (hub + 3), Legal, Privacy, Terms, Security, FAQ, Sitemap, Events, Newsroom, Resources |
| `/services` | 27 | Service index + 26 specialist services |
| `/cybersecurity` | 7 | Division hub + 6 category hubs |
| `/intelligence` | 6 | Division hub + 5 intelligence capabilities |
| `/consulting` | 7 | Division hub + 6 advisory services |
| `/academy` | 16 | Hub, VERITAS, 3 specialisations, philosophy, programmes, learning pathways, cohort structure, laboratories, assessments, instructors, admissions, FAQ, resources, portal |
| `/big-sam-academy` | 6 | Hub, 4 development pillars, platform status |
| `/software-systems` | 5 | Hub + 4 engineering disciplines |
| `/platforms` | 8 | Hub + 7 platform profiles |
| `/industries` | 10 | Hub + 9 sectors |
| `/research` | 3 | Hub, whitepaper, agenda |
| `/insights` | 5 | Hub + 4 original analytical briefings |
| `/glossary` | 34 | Knowledge Centre hub + 33 definitions |
| `/partnerships` | 4 | Hub + corporate, institutional and research |
| **Total** | **162** | |

Every page has a unique title and meta description, one `<h1>`, breadcrumbs where appropriate, a complete footer and tested internal links.

---

## 6. Design preservation and the HELIOS hybrid identity

### Preserved from the original
- Sticky header, brand position, mega-menu structure, mobile navigation and footer accordion patterns
- Hero families, section rhythm, two- and three-column grids, numbered cards, facts lists, steps, FAQ accordions, jump bars and CTA bands
- Buttons, chips, trust rows, stat bands, cards, tables and responsive behaviour
- Reveal animations, card spotlight, sticky jump highlighting and mobile menu transitions
- Inter and Lora typography, spacing and container system

### New HELIOS layer
- **Official palette:** Helios Emerald `#217326`, Deep Forest `#003619`, Emerald Dark `#045331`, Emerald Light `#7BDF89`, Midnight Navy `#051628`, Mint Glow `#5CFFBE`, Solar Gold `#FFDC5A`
- **Hybrid surfaces:** white/light corporate sections for Home, About, Leadership, Academy, Partnerships, Resources and Contact; Midnight Navy technology surfaces for Cybersecurity, Intelligence, Forensics, Software and platform showcases
- **Gold CTAs on dark surfaces; emerald CTAs on light surfaces**
- **Official emblem** in the header, footer, favicons, app icons and Open Graph cards
- **Nine local Open Graph cards** at 1200 × 630, generated from the emblem and brand system
- **Four original SVG illustrations** for the ecosystem, cyber core, intelligence and academy architecture
- **Monogram profile placeholders** instead of fabricated staff photographs

### Header behaviour
- Seven mega-menu sections: About, Cybersecurity, Intelligence, Academies, Software, Consulting, Resources
- Partnerships as a direct link
- Contact CTA in the header and mobile navigation
- Desktop navigation down to 1280 px; 1280–1399 px uses a compact variant; below 1280 px the accessible mobile menu is used

---

## 7. HELIOS content architecture

### Six operational divisions
1. **Cybersecurity and Intelligence Core** — offensive, defensive, digital forensics, cybercrime investigations, OSINT, threat actor tracking; 26 services and 6 category hubs
2. **Intelligence Layer** — behavioural intelligence, threat prediction, dark ecosystem mapping, intelligence systems, strategic briefings
3. **Helios Academy** — live professional training, three specialisations, admissions, laboratories, assessments, instructors, portal status
4. **Big Sam Academy** — advanced systems thinking, fast-track technical mastery, strategic intelligence, cross-domain innovation; kept distinct from Helios Academy
5. **Software and Systems** — secure infrastructure, encryption, AI-driven security tools, language and translation systems, platform ecosystem
6. **Consulting and Strategy** — national advisory, enterprise security architecture, risk governance, critical infrastructure, cybersecurity policy, CISO advisory

### Academy accuracy
- **VERITAS Cohort 1 is live and in session:** Digital Forensics, 8 weeks, 12 October to 5 December 2026, free of charge, over 100 registrations
- **Ethical Hacking** and **Cloud Security** are defined specialisations with cohort dates to be announced — not presented as open
- **SOC Analyst Training, Network Security and Governance, Risk & Compliance** are clearly labelled planned future tracks
- Portal pages state plainly that the public student portal is **not yet available**
- No accreditation, certification or court outcome is claimed without confirmation

### Platform status honesty
| Platform | Status used on site |
|---|---|
| NeuroBridge | In development |
| NeuroMap | Under refinement (React/Vite, FastAPI, Cytoscape.js) |
| Phantom Eye | In development (PHANTOM-EYE v3.0; 1,895-line Python framework, 12 modules) |
| Noctalon | In development |
| Nexus | In development |
| Helios Academy Platform | In use for Academy delivery |
| Big Sam Academy Platform | In development |

### Leadership and team
- Confirmed: **Samuel Tijesunimi Adeyinka** (Founder), **Mr. Charles Jeremiah** (Co-Founder), **Mr. Ibrahim Sulaimon** (Tutor), **Mrs. Mboutidem James** (Programme Associate)
- Executive offices (CEO, Managing Director, CFO, Chief Intelligence Officer) and six technical leadership roles are defined but shown as open where no holder is confirmed
- Profile images are replaceable monogram placeholders — no stock portraits or invented biographies

---

## 8. Configuration and future integrations

Central configuration: **`js/site.config.js`**

```js
window.HELIOS_CONFIG = {
  domain: "",
  companyEmail: "",
  phone: "",
  officeAddress: "",
  social: { linkedin: "", x: "", instagram: "", youtube: "" },
  academyPortalUrl: "",
  bigSamAcademyPortalUrl: "",
  contactEndpoint: "",
  newsletterEndpoint: ""
};
```

Behaviour when values are empty:
- Portal links resolve to the local coming-soon pages (`/academy/portal`, `/big-sam-academy/portal`) — no broken links and no fake login
- Contact and social details remain hidden — no fabricated email, phone, address or profiles
- Forms validate locally and explicitly state that **nothing has been sent** because no endpoint is configured
- The contact page states that official email, telephone and office address are to be confirmed
- The site does not invent API endpoints, credentials or student management functions

When values are supplied, the header/footer portal links, homepage Academy entry, contact details, social links and form delivery update automatically. When `domain` is set, generate the XML sitemap with:

```bash
python3 tools/build_sitemap.py
```

---

## 9. SEO and technical implementation

- 162 unique page titles; metadata trimmed to search-result lengths
- Unique meta descriptions; automatic sentence-boundary trimming
- Relative canonical links on every page (absolute URLs will follow domain confirmation)
- Open Graph and Twitter card metadata with nine local 1200 × 630 images
- Organization and FAQPage structured data; FAQ schema generated from visible accordions
- Semantic heading structure: one `<h1>` per page
- Descriptive image alt text
- Validated internal links, assets and in-page anchors
- HTML sitemap at `/sitemap` covering the site
- `robots.txt` present; deliberately **no `sitemap.xml`** until a real domain is configured
- `site.webmanifest` with 192 px and 512 px icons
- Local fonts, local images; no external analytics, advertising, chat or tracking scripts
- JS syntax checked with Node; CSS parsed with tinycss2
- WCAG contrast checked for the core palette; the only large-text endpoint at 4.09:1 is a display heading gradient, which passes the 3:1 large-text threshold

---

## 10. Testing and validation

| Test | Result |
|---|---|
| Build-time link / asset validation | **0 missing** across all pages |
| Residual visible Stack18 branding | **0 occurrences** |
| Static audit of all 162 pages | **0 issues, 0 warnings** |
| Title / description uniqueness and length | Pass |
| Duplicate IDs, alt text, labels, JSON-LD, anchors | Pass |
| CSS parse errors | 0 |
| JavaScript syntax | Pass |
| Selenium interactive checks | **150 / 150 pass** |
| Mega-menu open/close and links | Pass |
| Mobile navigation and accordions | Pass |
| Contact form: unconfigured endpoint | States that nothing was sent; no fake success |
| Config-override test | Portal URL, email row and social link update correctly |
| Responsive widths 390 / 768 / 1024 / 1279 / 1280 / 1440 | No horizontal overflow; correct nav mode |
| Full browser crawl, 162 pages at 1440 px | 0 console errors, 0 overflow, one h1 each |
| Representative mobile crawl, 22 pages at 390 px | 0 overflow |
| Reveal headings after scroll | Opacity reaches 1 |
| Sitemap generator with temporary domain | 162 URLs generated; configuration restored to empty |
| Archive integrity | Original pages, sitemap, README and index verified |

Test tooling is kept outside the website at `/home/kali/samintell/helios_build/` (`audit_site.py`, `test_selenium.py`, `test_crawl.py`, plus the content generator).

---

## 11. Remaining requirements and unresolved items

These are deliberately unresolved rather than invented:

1. **Production domain** — not confirmed. Canonical links and `og:image` remain relative; `sitemap.xml` is withheld. Set `domain` in `js/site.config.js` and run `tools/build_sitemap.py`.
2. **Official email, telephone and office address** — not confirmed. Values remain empty and hidden; contact page says so.
3. **Social profiles** — not confirmed. Links remain hidden until configured.
4. **Academy portal and Big Sam Academy portal URLs** — not available. Local coming-soon pages are used; configuration keys are ready.
5. **Form delivery endpoint** — no backend connected. Forms validate but do not claim delivery. Configure `contactEndpoint` when a backend exists.
6. **Leadership photography and biographies** — not supplied. Monogram placeholders are ready for approved professional images.
7. **Legal review** — terms and privacy pages describe the current static site honestly but should be reviewed by counsel before commercial launch, particularly once the domain, company details and any analytics are finalised.
8. **Academy future cohorts** — Ethical Hacking, Cloud Security and planned tracks await confirmed dates and admissions.
9. **Platform releases** — development-stage platforms must not be marketed as released products until confirmed.
10. **Analytics and consent** — intentionally absent. If analytics are added, a consent mechanism and updated privacy notice will be required.
11. **Hosting configuration** — HTTPS, custom 404 handling and caching are deployment responsibilities, not part of the static build.

---

## 12. How to run and maintain

```bash
cd /home/kali/Downloads/stack18-site
python3 -m http.server 8000
```

Open <http://localhost:8000/>.

Key files:

| File | Purpose |
|---|---|
| `css/helios.css` | HELIOS hybrid design layer and palette |
| `js/site.config.js` | Central domain, contact, social and portal configuration |
| `js/helios.js` | Config-driven links, honest forms, jump-bar state |
| `tools/build_sitemap.py` | Generates `sitemap.xml` only when a real domain is configured |
| `README.md` | Operational overview |
| `TRANSFORMATION_REPORT.md` | This report |

Original design system files are intact: `style.css`, `nav.css`, `company.css`, `pages-plus.css`, `skin.css`, `main.js`, `nav.js`, `skin.js`, `company.js`.

---

## 13. Content integrity statement

This transformation does not invent clients, case studies, partner logos, certifications, accreditations, press coverage, staff biographies, photographs, contact details, domains, pricing or platform releases.

Capabilities are described as capabilities. The Academy's live programme is described with its official facts. Development-stage platforms are labelled. Where a fact is not confirmed, the site says so or leaves the value unconfigured.

---

**HELIOS SYSTEMS**  
*Building the Intelligence Architecture of the Digital Age.*  
**Fast, Smart & Limitless.**
