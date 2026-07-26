#!/usr/bin/env python3
import json
import re
from collections import Counter
from pathlib import Path

html = Path("temp_shaqyru24.html").read_text(encoding="utf-8")
m = re.search(
    r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>',
    html,
)
data = json.loads(m.group(1))
bp = data["props"]["pageProps"]["pageData"]["builderPageData"]
blocks = bp["blocks"]

types = Counter()
for b in blocks:
    types[b["type"]] += 1
    for c in b.get("components", []):
        types[c["type"]] += 1

comps = blocks[0].get("components", []) if blocks else []
texts = [
    c.get("data", {}).get("content", "")[:100]
    for c in comps
    if c.get("type") == "text"
]

print("Block types:", dict(types))
print("Num top-level blocks:", len(blocks))
print("Components in first container:", len(comps))
if blocks:
    print("Container height:", blocks[0].get("style", {}).get("height"))
    print("Container bg:", blocks[0].get("style", {}).get("backgroundColor"))
print("Component breakdown:", dict(Counter(c["type"] for c in comps)))
print("Total images:", sum(1 for b in blocks for c in b.get("components", []) if c["type"] == "image"))
print("Total text:", sum(1 for b in blocks for c in b.get("components", []) if c["type"] == "text"))
print("Total lottie:", sum(1 for b in blocks for c in b.get("components", []) if c["type"] == "lottie"))
print("Total buttons:", sum(1 for b in blocks for c in b.get("components", []) if c["type"] == "button"))
for i, t in enumerate(texts[:8]):
    print(f"text[{i}]:", t.encode("unicode_escape").decode("ascii"))
