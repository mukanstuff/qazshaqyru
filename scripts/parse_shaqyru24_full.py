#!/usr/bin/env python3
"""Parse Shaqyru24 __NEXT_DATA__ from saved HTML."""
import json
import re
import sys
from collections import Counter
from pathlib import Path


def parse_file(path: str) -> None:
    html = Path(path).read_text(encoding="utf-8")
    print(f"\n=== {path} ({len(html)} bytes) ===")
    m = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>',
        html,
    )
    if not m:
        print("NO __NEXT_DATA__")
        # show title/body hints
        if "<title" in html:
            t = re.search(r"<title[^>]*>([^<]+)</title>", html)
            print("title:", t.group(1) if t else "?")
        return

    data = json.loads(m.group(1))
    pp = data.get("props", {}).get("pageProps", {})
    print("pageProps keys:", list(pp.keys())[:20])

    # view page
    if "pageData" in pp:
        pd = pp["pageData"]
        bp = pd.get("builderPageData") or {}
        blocks = bp.get("blocks") or []
        print("builderPageId:", pd.get("builderPageId"))
        print("blocks:", len(blocks))
        if blocks:
            comps = blocks[0].get("components") or []
            print("components:", len(comps))
            print("types:", dict(Counter(c["type"] for c in comps)))
            texts = [
                c.get("data", {}).get("content", "")[:120]
                for c in comps
                if c.get("type") == "text"
            ]
            for i, t in enumerate(texts[:15]):
                safe = t.replace("\n", " ")[:100].encode("unicode_escape").decode("ascii")
                print(f"  text[{i}]: {safe}")

    # quick-edit page
    for key in ("quickEditData", "editData", "formFields", "pageData", "builderPage"):
        if key in pp:
            val = pp[key]
            if isinstance(val, dict):
                print(f"{key} keys:", list(val.keys())[:30])
            else:
                print(f"{key}:", str(val)[:500])

    # dump all top-level pageProps structure (shallow)
    def summarize(obj, depth=0, max_depth=3):
        if depth > max_depth:
            return "..."
        if isinstance(obj, dict):
            return {k: summarize(v, depth + 1, max_depth) for k, v in list(obj.items())[:15]}
        if isinstance(obj, list):
            if not obj:
                return []
            return [summarize(obj[0], depth + 1, max_depth), f"...+{len(obj)-1}"]
        if isinstance(obj, str) and len(obj) > 80:
            return obj[:80] + "..."
        return obj

    print("pageProps summary:", json.dumps(summarize(pp), ensure_ascii=False, indent=2)[:8000])


if __name__ == "__main__":
    for p in sys.argv[1:] or ["temp_shaqyru24_v2.html", "temp_shaqyru24_edit.html"]:
        parse_file(p)
        # also dump raw pageProps for edit analysis
        html = Path(p).read_text(encoding="utf-8")
        m = re.search(
            r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>',
            html,
        )
        if m:
            data = json.loads(m.group(1))
            pp = data.get("props", {}).get("pageProps", {})
            out = Path("scripts/analysis_" + Path(p).stem + ".json")
            out.write_text(json.dumps(pp, ensure_ascii=False, indent=2)[:800000], encoding="utf-8")
            print("Wrote", out)
