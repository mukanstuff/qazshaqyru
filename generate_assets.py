#!/usr/bin/env python3
"""
Generate invitation site assets via Hugging Face Inference API.

Output modes:
  - Default batch: ornaments + backgrounds
  - --manifest landing: ~12 landing page images
  - Custom: --prompt --name --type
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("Missing dependency: requests")
    print("Install: pip install requests")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent
DEFAULT_ASSETS_DIR = REPO_ROOT / "apps" / "web" / "public" / "assets"
ENV_FILE = REPO_ROOT / ".env"
WEB_ROOT = REPO_ROOT / "apps" / "web"

MODEL_ID = "black-forest-labs/FLUX.1-schnell"
# Legacy api-inference.huggingface.co is decommissioned (DNS/410).
# Router hf-inference path matches old POST /models/{id} contract.
API_URL = f"https://router.huggingface.co/hf-inference/models/{MODEL_ID}"

RETRY_WAIT_SEC = 10
MAX_RETRIES = 12

ORNAMENT_PROMPT = (
    "Traditional luxury gold Kazakh ornament, isolated on black background, "
    "vector style, symmetric, wedding asset, high resolution, 8k"
)
BACKGROUND_PROMPT = (
    "Elegant soft cream and beige wedding background with subtle blurry golden "
    "sparkles and Central Asian patterns, minimalist, luxury texturing, 8k"
)

BATCH_ITEMS = 5

LANDING_MANIFEST: dict[str, str] = {
    "hero-main": (
        "Elegant Kazakh wedding celebration, couple in traditional attire, "
        "vertical editorial portrait, soft cream and forest green tones, "
        "natural light, luxury magazine photography, Kazakhstan toi atmosphere"
    ),
    "hero-accent": (
        "Close-up oval crop of wedding banquet details, golden table setting, "
        "Central Asian florals, cream and sage palette, editorial photography"
    ),
    "about-1": (
        "Abstract soft portrait silhouette of event organizer, warm cream background, "
        "minimal editorial style, forest green accents, professional headshot mood"
    ),
    "about-2": (
        "Abstract soft portrait silhouette, second organizer, sage green tones, "
        "cream background, editorial minimal photography"
    ),
    "floral-left": (
        "Delicate linear botanical illustration, Kazakh-inspired florals, "
        "single branch, isolated on white background, sage and gold line art"
    ),
    "floral-right": (
        "Mirrored delicate linear botanical illustration, Kazakh florals branch, "
        "isolated white background, sage gold line art, facing right"
    ),
    "video-banner": (
        "Wide cinematic sunset wedding banquet in Kazakhstan, long table, "
        "warm golden hour, cream and forest green, editorial wide shot"
    ),
    "testimonial-1": (
        "Professional headshot portrait, Kazakh woman early 30s, warm smile, "
        "neutral cream background, natural light, circular crop friendly"
    ),
    "testimonial-2": (
        "Professional headshot portrait, Kazakh man early 30s, friendly, "
        "neutral cream background, natural light, circular crop friendly"
    ),
    "blog-1": (
        "Editorial flat lay of digital wedding invitation on phone, "
        "cream paper textures, sage green accents, Kazakhstan wedding theme"
    ),
    "blog-2": (
        "Editorial photo of WhatsApp message with invitation link on phone, "
        "toi celebration context, warm cream tones"
    ),
    "blog-3": (
        "RSVP guest list concept, elegant notebook and phone, "
        "cream sage palette, Kazakhstan celebration planning"
    ),
}

# Filenames that get optional webp conversion (large hero/banner images)
WEBP_TARGETS = frozenset({"hero-main", "hero-accent", "video-banner"})

HF_SETUP_INSTRUCTIONS = """
==================================================================
  Hugging Face API key not found
==================================================================

Get a free token in ~1 minute:

  1. Sign up: https://huggingface.co/join
  2. Open:    https://huggingface.co/settings/tokens
  3. Create token with role "Read"
  4. Add to {env_path}:

       HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxx

  5. Re-run this script.

Note: first request may take 20-60 s while the model loads (503 = retry).
"""


# ---------------------------------------------------------------------------
# .env helpers (stdlib only)
# ---------------------------------------------------------------------------


def load_env_file(path: Path) -> dict[str, str]:
    """Parse KEY=VALUE lines from a .env file."""
    values: dict[str, str] = {}
    if not path.is_file():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        values[key] = value
    return values


def get_api_key() -> str | None:
    """Read HUGGINGFACE_API_KEY from environment or .env file."""
    direct = os.environ.get("HUGGINGFACE_API_KEY", "").strip()
    if direct:
        return direct

    env_values = load_env_file(ENV_FILE)
    key = env_values.get("HUGGINGFACE_API_KEY", "").strip()
    return key or None


def ensure_env_placeholder() -> None:
    """Create .env with placeholder if missing."""
    if ENV_FILE.is_file():
        content = ENV_FILE.read_text(encoding="utf-8")
        if "HUGGINGFACE_API_KEY" not in content:
            with ENV_FILE.open("a", encoding="utf-8") as fh:
                fh.write("\n# Hugging Face Inference API (free tier)\n")
                fh.write("HUGGINGFACE_API_KEY=\n")
        return

    ENV_FILE.write_text(
        "# Local environment (not committed)\n"
        "# Hugging Face Inference API — https://huggingface.co/settings/tokens\n"
        "HUGGINGFACE_API_KEY=\n",
        encoding="utf-8",
    )
    print(f"Created {ENV_FILE} — add your Hugging Face token there.")


# ---------------------------------------------------------------------------
# Hugging Face API
# ---------------------------------------------------------------------------


def generate_image(prompt: str, api_key: str) -> bytes:
    """Call HF Inference API; retry on overload / model loading."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {"inputs": prompt}

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(
                API_URL,
                headers=headers,
                json=payload,
                timeout=120,
            )
        except requests.RequestException as exc:
            print(f"  Network error (attempt {attempt}/{MAX_RETRIES}): {exc}")
            if attempt == MAX_RETRIES:
                raise
            print(f"  Waiting {RETRY_WAIT_SEC}s…")
            time.sleep(RETRY_WAIT_SEC)
            continue

        if response.status_code == 200:
            content_type = response.headers.get("Content-Type", "")
            if "application/json" in content_type:
                data = response.json()
                if isinstance(data, dict) and "error" in data:
                    raise RuntimeError(f"API error: {data['error']}")
                raise RuntimeError(f"Unexpected JSON response: {data!r}")
            return response.content

        if response.status_code in (503, 429, 502, 504):
            detail = _extract_error(response)
            print(
                f"  API busy ({response.status_code}, "
                f"attempt {attempt}/{MAX_RETRIES}): {detail}"
            )
            if attempt == MAX_RETRIES:
                response.raise_for_status()
            print(f"  Waiting {RETRY_WAIT_SEC}s…")
            time.sleep(RETRY_WAIT_SEC)
            continue

        detail = _extract_error(response)
        raise RuntimeError(
            f"API request failed ({response.status_code}): {detail}"
        )

    raise RuntimeError("Max retries exceeded")


def _extract_error(response: requests.Response) -> str:
    try:
        data = response.json()
        if isinstance(data, dict):
            return str(data.get("error", data))
        return json.dumps(data)
    except (json.JSONDecodeError, ValueError):
        return response.text[:300] or "(empty body)"


# ---------------------------------------------------------------------------
# File I/O & post-processing
# ---------------------------------------------------------------------------

VALID_TYPES = ("ornaments", "backgrounds", "landing")


def resolve_output_path(
    assets_dir: Path,
    asset_type: str,
    filename: str,
) -> Path:
    if asset_type not in VALID_TYPES:
        raise ValueError(
            f'--type must be one of {VALID_TYPES}, got: {asset_type!r}'
        )

    subdir = assets_dir / asset_type
    subdir.mkdir(parents=True, exist_ok=True)

    name = filename if filename.endswith(".png") else f"{filename}.png"
    return subdir / name


def save_image(path: Path, data: bytes) -> None:
    path.write_bytes(data)
    print(f"  Saved: {path.relative_to(REPO_ROOT)}")


def try_convert_webp(png_path: Path) -> None:
    """Convert PNG to WebP via sharp (pnpm) or Pillow fallback."""
    webp_path = png_path.with_suffix(".webp")
    if webp_path.is_file():
        return

    # Try sharp via npx in apps/web
    if WEB_ROOT.is_dir():
        try:
            script = (
                f"const sharp=require('sharp');"
                f"sharp({json.dumps(str(png_path))})"
                f".webp({{quality:85}})"
                f".toFile({json.dumps(str(webp_path))})"
                f".then(()=>process.exit(0)).catch(e=>{{console.error(e);process.exit(1)}});"
            )
            result = subprocess.run(
                ["pnpm", "exec", "node", "-e", script],
                cwd=WEB_ROOT,
                capture_output=True,
                text=True,
                timeout=60,
            )
            if result.returncode == 0 and webp_path.is_file():
                print(f"  WebP: {webp_path.relative_to(REPO_ROOT)}")
                return
        except (subprocess.SubprocessError, FileNotFoundError):
            pass

    # Pillow fallback
    try:
        from PIL import Image  # type: ignore[import-untyped]

        with Image.open(png_path) as img:
            img.save(webp_path, "WEBP", quality=85)
        print(f"  WebP (Pillow): {webp_path.relative_to(REPO_ROOT)}")
    except ImportError:
        print(f"  WebP skip (no sharp/Pillow): {png_path.name}")
    except OSError as exc:
        print(f"  WebP failed for {png_path.name}: {exc}")


# ---------------------------------------------------------------------------
# Generation modes
# ---------------------------------------------------------------------------


def generate_single(
    prompt: str,
    filename: str,
    asset_type: str,
    assets_dir: Path,
    api_key: str,
    to_webp: bool = False,
) -> None:
    out_path = resolve_output_path(assets_dir, asset_type, filename)
    print(f"Generating {asset_type}/{out_path.name}…")
    print(f"  Prompt: {prompt[:80]}{'…' if len(prompt) > 80 else ''}")
    data = generate_image(prompt, api_key)
    save_image(out_path, data)
    stem = out_path.stem
    if to_webp or stem in WEBP_TARGETS:
        try_convert_webp(out_path)


def generate_batch(assets_dir: Path, api_key: str) -> None:
    (assets_dir / "ornaments").mkdir(parents=True, exist_ok=True)
    (assets_dir / "backgrounds").mkdir(parents=True, exist_ok=True)

    print(f"Output directory: {assets_dir.relative_to(REPO_ROOT)}")
    print(f"Model: {MODEL_ID}\n")

    for i in range(1, BATCH_ITEMS + 1):
        print(f"[{i}/{BATCH_ITEMS}] Ornament…")
        data = generate_image(ORNAMENT_PROMPT, api_key)
        save_image(assets_dir / "ornaments" / f"ornament_{i}.png", data)

    print()

    for i in range(1, BATCH_ITEMS + 1):
        print(f"[{i}/{BATCH_ITEMS}] Background…")
        data = generate_image(BACKGROUND_PROMPT, api_key)
        save_image(assets_dir / "backgrounds" / f"background_{i}.png", data)

    print("\nDone.")


def generate_landing_manifest(assets_dir: Path, api_key: str) -> None:
    """Batch-generate all landing images from LANDING_MANIFEST."""
    landing_dir = assets_dir / "landing"
    landing_dir.mkdir(parents=True, exist_ok=True)

    items = list(LANDING_MANIFEST.items())
    total = len(items)
    print(f"Landing manifest: {total} images -> {landing_dir.relative_to(REPO_ROOT)}")
    print(f"Model: {MODEL_ID}\n")

    failed: list[str] = []
    for idx, (name, prompt) in enumerate(items, start=1):
        print(f"[{idx}/{total}] {name}…")
        try:
            generate_single(
                prompt=prompt,
                filename=name,
                asset_type="landing",
                assets_dir=assets_dir,
                api_key=api_key,
                to_webp=name in WEBP_TARGETS,
            )
        except (RuntimeError, requests.RequestException) as exc:
            print(f"  FAILED: {exc}")
            failed.append(name)
        print()

    if failed:
        print(f"Completed with failures: {', '.join(failed)}")
        print("Re-run with --manifest landing to retry failed items.")
    else:
        print("Landing manifest complete.")


FLAGSHIP_MANIFEST_JSON = WEB_ROOT / "scripts" / "flagship-asset-manifest.json"


def generate_template_manifest(slug: str, assets_dir: Path, api_key: str) -> None:
    """Generate template pack from apps/web/scripts/flagship-asset-manifest.json."""
    if not FLAGSHIP_MANIFEST_JSON.is_file():
        raise FileNotFoundError(f"Missing manifest: {FLAGSHIP_MANIFEST_JSON}")

    data = json.loads(FLAGSHIP_MANIFEST_JSON.read_text(encoding="utf-8"))
    templates = data.get("templates", {})
    if slug not in templates:
        raise ValueError(f"Unknown template slug in manifest: {slug!r}")

    template = templates[slug]
    out_dir = assets_dir / "templates" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    assets = template.get("assets", [])
    total = len(assets)
    aesthetic = template.get("aesthetic", slug)
    print(f"Template manifest: {slug} ({aesthetic})")
    print(f"Output: {out_dir.relative_to(REPO_ROOT)} ({total} assets)")
    print(f"Model: {MODEL_ID}\n")

    failed: list[str] = []
    for idx, item in enumerate(assets, start=1):
        rel_path = item["path"]
        prompt = item["prompt"]
        dest = out_dir / rel_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"[{idx}/{total}] {rel_path}…")
        try:
            image_data = generate_image(prompt, api_key)
            dest.write_bytes(image_data)
            print(f"  Saved: {dest.relative_to(REPO_ROOT)}")
            if dest.suffix.lower() == ".png":
                try_convert_webp(dest)
        except (RuntimeError, requests.RequestException, OSError) as exc:
            print(f"  FAILED: {exc}")
            failed.append(rel_path)
        print()

    if failed:
        print(f"Completed with failures: {', '.join(failed)}")
        print(f"Re-run: python generate_assets.py --manifest {slug}")
    else:
        print(f"Template manifest complete: {slug}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate invitation assets via Hugging Face SDXL API.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Batch: 5 ornaments + 5 backgrounds (default)
  python generate_assets.py

  # Landing page manifest (~12 images)
  python generate_assets.py --manifest landing

  # Wedding-luxury template pack
  python generate_assets.py --manifest wedding-luxury

  # Single custom asset
  python generate_assets.py \\
    --prompt "Traditional gold Kazakh ornament…" \\
    --name "corner-01.png" \\
    --type ornaments
        """,
    )
    parser.add_argument(
        "--prompt",
        help="Custom text-to-image prompt (skips batch mode)",
    )
    parser.add_argument(
        "--name",
        help='Output filename, e.g. "ornament_custom.png"',
    )
    parser.add_argument(
        "--type",
        choices=list(VALID_TYPES),
        help="Subfolder under public/assets/ (landing → public/assets/landing/)",
    )
    parser.add_argument(
        "--manifest",
        choices=["landing", "wedding-luxury"],
        help="Batch manifest preset",
    )
    parser.add_argument(
        "--webp",
        action="store_true",
        help="Also emit .webp for single/custom generation",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_ASSETS_DIR,
        help=f"Assets root (default: {DEFAULT_ASSETS_DIR.relative_to(REPO_ROOT)})",
    )
    return parser


def main() -> int:
    ensure_env_placeholder()

    parser = build_parser()
    args = parser.parse_args()

    api_key = get_api_key()
    if not api_key:
        print(HF_SETUP_INSTRUCTIONS.format(env_path=ENV_FILE))
        return 1

    if args.manifest == "landing":
        generate_landing_manifest(args.output_dir, api_key)
        return 0

    if args.manifest == "wedding-luxury":
        generate_template_manifest("wedding-luxury", args.output_dir, api_key)
        return 0

    custom_mode = any([args.prompt, args.name, args.type])
    if custom_mode:
        missing = [
            flag
            for flag, val in [
                ("--prompt", args.prompt),
                ("--name", args.name),
                ("--type", args.type),
            ]
            if not val
        ]
        if missing:
            parser.error(
                f"Custom mode requires --prompt, --name, and --type. Missing: {', '.join(missing)}"
            )
        generate_single(
            prompt=args.prompt,
            filename=args.name,
            asset_type=args.type,
            assets_dir=args.output_dir,
            api_key=api_key,
            to_webp=args.webp,
        )
        return 0

    generate_batch(args.output_dir, api_key)
    return 0


if __name__ == "__main__":
    sys.exit(main())
