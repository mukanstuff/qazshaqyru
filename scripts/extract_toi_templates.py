#!/usr/bin/env python3
"""Extract toi.com.kz template catalog from bundled JS."""
import json
import re
from pathlib import Path

js = Path(__file__).resolve().parents[1] / "temp_toi_index.js"
text = js.read_text(encoding="utf-8", errors="ignore")

# template import map chunk
m = re.search(r'Xg=Object\.assign\(\{(.+?)\}\)', text, re.DOTALL)
if m:
    chunk = m.group(1)
    paths = re.findall(r'"(\.\./\.\./templates/[^"]+)"', chunk)
    print(f"HTML template modules: {len(paths)}")
    uzatu = [p for p in paths if "/uzatu/" in p]
    wedding = [p for p in paths if "/uilenu/" in p or "/wedding/" in p or "/ui/" in p]
    print("  uzatu:", uzatu[:10])
    print("  wedding-ish:", wedding[:10])

# Find template23 import hash
for pat in ["template23", "uzatu/template23"]:
    idx = text.find(pat)
    if idx >= 0:
        print(f"\n'{pat}' context:", text[max(0, idx - 80) : idx + 120])

# Extract SURET image template defs (tier:"SURET")
suret_matches = list(re.finditer(r'\{id:"suret/[^"]+"', text))
print(f"\nSURET templates found: {len(suret_matches)}")
for m in suret_matches[:5]:
    snippet = text[m.start() : m.start() + 600]
    print("---")
    print(snippet[:500])

# Look for editor field keys
for key in [
    "brideName",
    "groomName",
    "eventDate",
    "venue",
    "musicUrl",
    "countdown",
    "calendar",
    "rsvp",
    "wishes",
    "photoSlot",
    "editableSlots",
    "replaceText",
    "data-field",
    "contenteditable",
]:
    if key in text:
        print(f"key '{key}': YES")

# Write wedding370 analysis to JSON
import json as j
from collections import Counter

html = Path(__file__).resolve().parents[1] / "temp_shaqyru24_wedding370.html"
raw = html.read_text(encoding="utf-8")
m2 = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>', raw)
pp = j.loads(m2.group(1))["props"]["pageProps"]
comps = pp["pageData"]["builderPageData"]["blocks"][0]["components"]
out = {
    "builderPageId": pp["pageData"]["builderPageId"],
    "types": dict(Counter(c["type"] for c in comps)),
    "texts": [
        {
            "content": c["data"].get("content", "")[:200],
            "font": c["data"].get("fontFamily") or c.get("style", {}).get("fontFamily"),
            "y": c.get("position", {}).get("y"),
            "z": c.get("position", {}).get("z"),
        }
        for c in comps
        if c["type"] == "text"
    ],
    "widgets": [
        {"type": c["type"], "data_keys": list((c.get("data") or {}).keys())[:8]}
        for c in comps
        if c["type"] not in ("image", "shape", "lottie")
    ],
}
Path(__file__).resolve().parents[1].joinpath("scripts/competitor_analysis_output.json").write_text(
    j.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("\nWrote scripts/competitor_analysis_output.json")
