#!/usr/bin/env python3
"""Build the Casa Ipê site from src/index.html and the asset manifest.

Outputs:
  index.html            -> references assets/<id>.jpg|mp4 (for hosting from this folder)
  dist/casa-ipe.html    -> every asset inlined as a data URI (for the Claude artifact)

Assets come from assets/manifest.json. Each slot can carry:
  "url":  the Higgsfield result URL (downloaded into assets/raw/)
  "file": a local file already on disk
Slots with neither are left empty: the element gets the `hidden` attribute and
the CSS fallback shows instead, so the page never renders a broken image.

Usage:  python3 build.py            (from casa-ipe/)
        python3 build.py --hotlink  index.html links straight to the Higgsfield result URLs
                                    (no download needed; dist/ still needs local bytes)
"""
import base64
import io
import json
import mimetypes
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "src" / "index.html"
ASSETS = HERE / "assets"
RAW = ASSETS / "raw"
DIST = HERE / "dist"
MANIFEST = ASSETS / "manifest.json"

INLINE_BUDGET = 15 * 1024 * 1024  # artifact pages must stay under 16 MB
VIDEO_INLINE_MAX = 7 * 1024 * 1024


def log(msg):
    print(msg, file=sys.stderr)


def download(url, dest):
    import requests

    if dest.exists() and dest.stat().st_size > 0:
        return dest
    log(f"  fetching {url[:80]}…")
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    dest.write_bytes(r.content)
    return dest


def encode_jpeg(src_path, max_px, quality):
    from PIL import Image, ImageOps

    im = Image.open(src_path)
    im = ImageOps.exif_transpose(im).convert("RGB")
    im.thumbnail((max_px, max_px), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
    return buf.getvalue()


def data_uri(data, mime):
    return f"data:{mime};base64," + base64.b64encode(data).decode("ascii")


HOTLINK = "--hotlink" in sys.argv  # index.html points at the Higgsfield URLs instead of local copies


def resolve_source(slot):
    """Return a local path for the slot's raw media, or None."""
    if HOTLINK and not slot.get("file"):
        return None
    if slot.get("file"):
        p = Path(slot["file"])
        p = p if p.is_absolute() else HERE / p
        return p if p.exists() else None
    if slot.get("url"):
        ext = ".mp4" if slot["kind"] == "video" else ".bin"
        guess = mimetypes.guess_extension(mimetypes.guess_type(slot["url"].split("?")[0])[0] or "")
        if guess and slot["kind"] == "image":
            ext = guess
        RAW.mkdir(parents=True, exist_ok=True)
        return download(slot["url"], RAW / f"{slot['id']}{ext}")
    return None


def build():
    manifest = json.loads(MANIFEST.read_text())
    html = SRC.read_text()
    ASSETS.mkdir(exist_ok=True)
    DIST.mkdir(exist_ok=True)

    rel = {}     # slot id -> relative path (for index.html)
    inline = {}  # slot id -> data URI (for dist)
    inline_bytes = 0

    for slot in manifest["slots"]:
        sid = slot["id"]
        src = resolve_source(slot)
        if not src:
            if HOTLINK and slot.get("url"):
                rel[sid] = slot["url"]
                log(f"- {sid}: hotlinked")
            else:
                log(f"- {sid}: no asset yet (fallback)")
            continue
        if slot["kind"] == "image":
            full = encode_jpeg(src, slot.get("max_px", 1600), 84)
            (ASSETS / f"{sid}.jpg").write_bytes(full)
            small = encode_jpeg(src, slot.get("inline_px", 1200), 78)
            rel[sid] = f"assets/{sid}.jpg"
            inline[sid] = data_uri(small, "image/jpeg")
            inline_bytes += len(small)
            log(f"- {sid}: {len(full)//1024} KB on disk, {len(small)//1024} KB inline")
        else:
            data = src.read_bytes()
            (ASSETS / f"{sid}.mp4").write_bytes(data)
            rel[sid] = f"assets/{sid}.mp4"
            if len(data) <= VIDEO_INLINE_MAX:
                inline[sid] = data_uri(data, "video/mp4")
                inline_bytes += len(data)
                log(f"- {sid}: {len(data)//1024} KB video, inlined")
            else:
                log(f"- {sid}: {len(data)//1024} KB video, too large to inline (poster only)")

    if HOTLINK:
        # no local bytes: the artifact build also links to the Higgsfield URLs; the page hides
        # any slot the viewer's sandbox refuses to load (onerror below) and shows the CSS fallback
        for slot in manifest["slots"]:
            if slot["id"] not in inline and slot.get("url"):
                inline[slot["id"]] = slot["url"]

    if inline_bytes * 4 / 3 > INLINE_BUDGET:
        log(f"WARNING: inline payload ~{inline_bytes*4//3//1024//1024} MB exceeds the artifact budget")

    slots = {s["id"]: s for s in manifest["slots"]}

    def guard(src):
        return ' onerror="this.hidden=true"' if src.startswith("http") else ""

    def render(lookup):
        out = html

        def img_sub(m):
            tag, sid = m.group(0), m.group(1)
            if sid in lookup:
                return tag.replace(f'data-asset="{sid}"', f'data-asset="{sid}" src="{lookup[sid]}"{guard(lookup[sid])}')
            return tag.replace(f'data-asset="{sid}"', f'data-asset="{sid}" hidden')

        out = re.sub(r'<img\b[^>]*\bdata-asset="([\w-]+)"[^>]*>', img_sub, out)

        def video_sub(m):
            open_tag, sid, inner = m.group(1), m.group(2), m.group(3)
            slot = slots.get(sid, {})
            poster = lookup.get(slot.get("start_image", ""))
            if sid in lookup:
                attrs = f' src="{lookup[sid]}"' + (f' poster="{poster}"' if poster else "") + guard(lookup[sid])
                return open_tag.replace(f'data-asset="{sid}"', f'data-asset="{sid}"{attrs}') + inner + "</video>"
            return open_tag.replace(f'data-asset="{sid}"', f'data-asset="{sid}" hidden') + inner + "</video>"

        out = re.sub(r'(<video\b[^>]*\bdata-asset="([\w-]+)"[^>]*>)(.*?)</video>', video_sub, out, flags=re.S)

        def bg_sub(m):
            sid = m.group(1)
            if sid in lookup:
                return f'data-bg="{sid}" style="--img:url({lookup[sid]})"'
            return f'data-bg="{sid}"'

        out = re.sub(r'data-bg="([\w-]+)"', bg_sub, out)
        return out

    (HERE / "index.html").write_text(render(rel))
    (DIST / "casa-ipe.html").write_text(render(inline))
    log(f"wrote index.html and dist/casa-ipe.html ({len(rel)} of {len(slots)} slots filled)")


if __name__ == "__main__":
    build()
