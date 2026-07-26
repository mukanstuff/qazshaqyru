#!/usr/bin/env python3
import json
from pathlib import Path

pp = json.loads(Path("scripts/analysis_temp_shaqyru24_v2.html.json").read_text(encoding="utf-8"))
blocks = pp["pageData"]["builderPageData"]["blocks"]
comps = blocks[0]["components"]

print("=== TEXT COMPONENTS ===")
for c in comps:
    if c["type"] != "text":
        continue
    d = c.get("data", {})
    print(json.dumps({"id": c["id"], "data_keys": list(d.keys()), "content": d.get("content", "")[:120], **{k: d[k] for k in d if k not in ("content", "animationData") and not isinstance(d.get(k), dict)}}, ensure_ascii=False, indent=2))

print("\n=== PHOTO SLOTS ===")
for c in comps:
    d = c.get("data", {})
    if c["type"] == "image" and d.get("isPhoto"):
        print(c["id"], d.get("src", "")[:80])

print("\n=== PAGE META ===")
pd = pp["pageData"]
for k in ("mode", "lang", "siteId", "status", "isPaid", "siteCategory", "audioLink", "siteSlug"):
    print(k, pd.get(k))

print("\n=== COMPONENT TYPE SUMMARY ===")
from collections import Counter
print(dict(Counter(c["type"] for c in comps)))
