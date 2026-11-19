#!/usr/bin/env python3
"""Generate sitemap.xml for the HELIOS SYSTEMS static site.

The production domain is read from js/site.config.js. Until it is confirmed,
the script refuses to create a sitemap rather than inventing a domain.

Usage:
    python3 tools/build_sitemap.py
"""
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def domain():
    path = os.path.join(ROOT, "js", "site.config.js")
    try:
        text = open(path, encoding="utf-8").read()
    except OSError:
        return ""
    m = re.search(r'domain\s*:\s*"([^"]*)"', text)
    return m.group(1).strip().rstrip("/") if m else ""


def main():
    base = domain()
    if not base:
        print("No production domain is configured in js/site.config.js.")
        print("Set 'domain' to the official URL (for example https://www.example.org), then run this script again.")
        print("No sitemap.xml was written, so no domain has been invented.")
        return 1

    urls = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = sorted(d for d in dirnames if d not in (".git", "assets", "tools", "fonts"))
        if "index.html" not in filenames:
            continue
        rel = os.path.relpath(dirpath, ROOT)
        path = "/" if rel == "." else "/" + rel.replace(os.sep, "/")
        urls.append(path)

    urls = sorted(set(urls))
    today = date.today().isoformat()
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path in urls:
        lines.append(f"  <url><loc>{base}{path}</loc><lastmod>{today}</lastmod></url>")
    lines.append("</urlset>")
    out = os.path.join(ROOT, "sitemap.xml")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Wrote {out} with {len(urls)} URLs for {base}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
