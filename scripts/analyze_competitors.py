#!/usr/bin/env python3
"""Analyze competitor invitation HTML/JS."""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def analyze_shaqyru24(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    m = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>',
        html,
    )
    if not m:
        print(f"NO __NEXT_DATA__ in {path.name}")
        return
    pp = json.loads(m.group(1))["props"]["pageProps"]
    pd = pp["pageData"]["builderPageData"]
    comps = pd["blocks"][0]["components"]
    print(f"\n=== SHAQYRU24 {path.name} ===")
    print("builderPageId:", pp["pageData"].get("builderPageId"))
    print("container height:", pd["blocks"][0]["style"].get("height"))
    print("component types:", dict(Counter(c["type"] for c in comps)))
    photos = [c for c in comps if c["type"] == "image" and c.get("data", {}).get("isPhoto")]
    decor = [c for c in comps if c["type"] == "image" and not c.get("data", {}).get("isPhoto")]
    texts = [c for c in comps if c["type"] == "text"]
    print("photo images:", len(photos), "| decor images:", len(decor))
    print("text blocks:", len(texts))
    for i, t in enumerate(texts):
        c = t["data"].get("content", "").replace("\n", " ")[:140]
        pos = t.get("position", {})
        font = t.get("data", {}).get("fontFamily") or t.get("style", {}).get("fontFamily", "")
        print(f"  T{i}: z={pos.get('z')} y={pos.get('y', 0):.1f} font={font} | {c}")


def analyze_toi_js(path: Path) -> None:
    js = path.read_text(encoding="utf-8", errors="ignore")
    print(f"\n=== TOI.COM.KZ JS ({path.name}, {len(js)} bytes) ===")
    for needle in [
        "template23",
        "new-live",
        "uzatu",
        "fields",
        "placeholders",
        "countdown",
        "rsvp",
        "wishes",
        "coverPhoto",
        "groomName",
        "brideName",
    ]:
        print(f"  '{needle}': {js.count(needle)} hits")

    # extract template path references
    tpl_refs = sorted(set(re.findall(r"[\w-]+/template\d+\.html", js)))
    print("  template refs:", tpl_refs[:20])

    # look for field schema patterns
    for pat in [
        r"labelKz",
        r"labelRu",
        r"bodyText",
        r"eventDate",
        r"venueName",
        r"isPhoto",
        r"backgroundImage",
        r"htmlTemplate",
        r"iframe",
    ]:
        if pat.lower() in js.lower() or pat in js:
            print(f"  pattern '{pat}': found")


if __name__ == "__main__":
    analyze_shaqyru24(ROOT / "temp_shaqyru24_wedding370.html")
    analyze_shaqyru24(ROOT / "temp_shaqyru24_v2.html")
    js_path = ROOT / "temp_toi_index.js"
    if js_path.exists():
        analyze_toi_js(js_path)
