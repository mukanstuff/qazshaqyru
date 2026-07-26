#!/usr/bin/env python3
import json
import re
from pathlib import Path

for name in ("temp_shaqyru24_v2.html", "temp_shaqyru24_edit.html"):
    html = Path(name).read_text(encoding="utf-8")
    m = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>',
        html,
    )
    if not m:
        Path(f"scripts/analysis_{name}.json").write_text(
            json.dumps({"error": "no __NEXT_DATA__", "bytes": len(html)}),
            encoding="utf-8",
        )
        continue
    pp = json.loads(m.group(1)).get("props", {}).get("pageProps", {})
    Path(f"scripts/analysis_{name}.json").write_text(
        json.dumps(pp, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(name, "->", list(pp.keys()))
