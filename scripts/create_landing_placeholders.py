"""Create SVG placeholder landing assets."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "apps" / "web" / "public" / "assets" / "landing"
ROOT.mkdir(parents=True, exist_ok=True)

PALETTE = {
    "hero-main": ("#3A4B3A", "#F7F5F0"),
    "hero-accent": ("#8A9A86", "#F7F5F0"),
    "about-1": ("#8A9A86", "#EDE9E0"),
    "about-2": ("#3A4B3A", "#EDE9E0"),
    "floral-left": ("#8A9A86", "none"),
    "floral-right": ("#8A9A86", "none"),
    "video-banner": ("#3A4B3A", "#D4C9B8"),
    "testimonial-1": ("#8A9A86", "#F0EDE6"),
    "testimonial-2": ("#3A4B3A", "#F0EDE6"),
    "blog-1": ("#8A9A86", "#F7F5F0"),
    "blog-2": ("#3A4B3A", "#F7F5F0"),
    "blog-3": ("#8A9A86", "#EDE9E0"),
}

SIZES = {
    "hero-main": (800, 1200),
    "hero-accent": (600, 800),
    "about-1": (400, 400),
    "about-2": (400, 400),
    "floral-left": (200, 600),
    "floral-right": (200, 600),
    "video-banner": (1600, 600),
    "testimonial-1": (200, 200),
    "testimonial-2": (200, 200),
    "blog-1": (600, 400),
    "blog-2": (600, 400),
    "blog-3": (600, 400),
}

for name, (fg, bg) in PALETTE.items():
    w, h = SIZES[name]
    bg_rect = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg != "none" else ""
    floral = ""
    if "floral" in name:
        floral = (
            f'<path d="M50 20 Q80 80 50 140 Q20 80 50 20" '
            f'stroke="{fg}" fill="none" stroke-width="2"/>'
        )
    font_size = min(w, h) // 12
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}">{bg_rect}'
        f'<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" '
        f'fill="{fg}" font-family="serif" font-size="{font_size}">{name}</text>{floral}</svg>'
    )
    (ROOT / f"{name}.svg").write_text(svg, encoding="utf-8")
    print(f"placeholder: {name}.svg")

print("done")
