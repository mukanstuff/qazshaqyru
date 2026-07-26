#!/usr/bin/env python3
import json
from pathlib import Path

pp = json.loads(Path("scripts/analysis_temp_shaqyru24_v2.html.json").read_text(encoding="utf-8"))
comps = pp["pageData"]["builderPageData"]["blocks"][0]["components"]
lines = []
lines.append("# Shaqyru24 template 5b78d64a - component inventory\n")
lines.append(f"Total components: {len(comps)}\n")

for c in comps:
    t = c["type"]
    d = c.get("data", {})
    if t == "text":
        lines.append(f"\n## TEXT {c['id']}\n")
        lines.append(f"tag: {d.get('tag')}\n")
        lines.append(f"content:\n{d.get('content', '')}\n")
    elif t == "image":
        lines.append(f"\n## IMAGE {c['id']} isPhoto={d.get('isPhoto')}\n")
        lines.append(f"src: {d.get('src', '')[:120]}\n")
    elif t in ("calendar", "timer", "form2", "fixed-wishes", "wishes-list", "audio-fixed", "video", "button"):
        lines.append(f"\n## {t.upper()} {c['id']}\n")
        keys = {k: v for k, v in d.items() if k != "animationData" and not isinstance(v, (dict, list)) or k in ("form_fields",)}
        if t == "form2" and "form_fields" in d:
            lines.append(json.dumps(d["form_fields"], ensure_ascii=False, indent=2))
        else:
            lines.append(json.dumps({k: (str(v)[:200] if not isinstance(v, (dict, list)) else type(v).__name__) for k, v in list(d.items())[:20]}, ensure_ascii=False, indent=2))

Path("scripts/shaqyru24_v2_inventory.md").write_text("".join(lines), encoding="utf-8")
print("Wrote scripts/shaqyru24_v2_inventory.md")
