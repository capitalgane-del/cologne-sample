"""Crop product photos to uniform square images for the shop.

Every bottle is scaled so its larger side fills FILL of the frame, centred
horizontally, with its base at BASE of the frame height. The background wall
is colour-matched to one target so all photos share the same tone. If a bottle
sits too close to the top of its photo, plain wall is added above it.

Usage:
    pip install pillow pillow-heif numpy
    python3 tools/process_photos.py <folder with the original photos>

To add a photo: put it in that folder, add a line to BOXES with the product id
and where the bottle sits in the photo (left, right, top, base) as fractions of
the photo's width and height, then run the script. It writes images/<id>.jpg;
set image: "images/<id>.jpg" on the product in js/products.js.
"""
import numpy as np, os, sys
from PIL import Image, ImageOps, ImageFilter
import pillow_heif
pillow_heif.register_heif_opener()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else ROOT
DST = os.path.join(ROOT, "images")
SIZE, FILL, BASE = 1000, 0.82, 0.95
WALL = np.array([228, 226, 222], float)  # target background tone

# file: (product id, x0, x1, y0, y1) as fractions of the photo; y1 = bottle base
BOXES = {
    "IMG_7190.HEIC": ("versace-eros-edt", .23, .73, .04, .93),
    "IMG_7191.HEIC": ("nautica-voyage", .30, .76, .07, .89),
    "IMG_7192.HEIC": ("valentino-bir-intense", .31, .69, .09, .97),
    "IMG_7194.HEIC": ("lattafa-khamrah", .31, .66, .21, .97),
    "IMG_7195.HEIC": ("azzaro-wanted-edt", .35, .67, .10, .95),
    "IMG_7196.HEIC": ("fa-liquid-brun", .36, .61, .06, .93),
    "IMG_7197.HEIC": ("mm-sailing-day", .40, .66, .09, .97),
    "IMG_7198.HEIC": ("lattafa-oud-for-glory", .35, .68, .12, .98),
    "IMG_7199.HEIC": ("fa-aether-extrait", .33, .69, .05, .98),
    "IMG_7200.HEIC": ("fa-ravine-ginger", .36, .65, .00, .94),
    "IMG_7201.HEIC": ("jpg-le-male-edt", .31, .60, .04, .98),
    "IMG_7202.HEIC": ("davidoff-cool-water", .37, .63, .07, .97),
    "IMG_7204.HEIC": ("al-haramain-amber-oud-ruby", .36, .70, .08, .95),
    "IMG_7205.HEIC": ("rasasi-hawas-ice", .35, .73, .05, .95),
    "IMG_7206.HEIC": ("beckham-intimately", .26, .76, .30, .98),
    "IMG_7207.HEIC": ("beckham-instinct", .30, .68, .11, .98),
    "IMG_7208.jpg":  ("fa-ravine-ice", .35, .62, .06, .97),
}

def wall_above(a, pad_h, bl, br, by0):
    """Plain wall to add above the photo: the photo's top rows mirrored upward,
    so texture and lighting continue across the join. Where the bottle itself
    would be mirrored (it reaches into those rows), those columns reuse the wall
    just above the bottle instead."""
    H, W, _ = a.shape
    strip = a[:pad_h][::-1].copy()
    src_row = np.arange(pad_h)[::-1]            # photo row each strip row came from
    hit = src_row >= by0 - 0.01 * H             # rows that would show the bottle
    clear = int(by0 - 0.01 * H)                # wall rows above the bottle top
    if hit.any() and br > bl and clear >= 8:
        # reuse the clean wall directly above the bottle, bouncing back and forth
        # through those rows: same columns, so the lighting matches exactly
        m = src_row[hit] % (2 * clear)
        m = np.where(m >= clear, 2 * clear - 1 - m, m)
        rows = strip[hit]
        fill = a[m][:, bl:br]
        if pad_h > 2 * clear:
            # the clean band repeats several times: soften it so no pattern shows,
            # fading the softening in from the band's edges
            soft = np.asarray(Image.fromarray(fill.astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))).astype(float)
            e = max(1, min(120, (br - bl) // 6))
            ramp = np.minimum(np.arange(br - bl), np.arange(br - bl)[::-1]) / e
            k = np.clip(ramp, 0, 1)[None, :, None]
            fill = soft * k + fill * (1 - k)
        rows[:, bl:br] = fill
        strip[hit] = rows
    elif hit.any() and br > bl:
        # bottle touches the top of the photo: borrow wall from either side
        cols = np.arange(bl, br)

        def reflect(idx):
            idx = np.abs(idx)                    # bounce off the left edge
            idx = np.where(idx >= W, 2 * (W - 1) - idx, idx)
            return np.clip(idx, 0, W - 1)

        from_left = reflect(2 * bl - cols - 1)
        from_right = reflect(2 * br - cols + 1)
        t = (cols - bl) / max(br - bl - 1, 1)
        t = (t * t * (3 - 2 * t))[None, :, None]  # smooth crossfade left -> right
        rows = strip[hit]
        rows[:, bl:br] = rows[:, from_left] * (1 - t) + rows[:, from_right] * t
        strip[hit] = rows
    return strip

def process(name, pid, fx0, fx1, fy0, fy1):
    im = ImageOps.exif_transpose(Image.open(f"{SRC}/{name}")).convert("RGB")
    a = np.asarray(im).astype(float)
    H, W, _ = a.shape
    bx0, bx1, by0, by1 = fx0 * W, fx1 * W, fy0 * H, fy1 * H

    # colour-match the wall (sampled left of the bottle, upper part of the photo)
    sx1 = max(int(bx0 - 0.04 * W), int(0.08 * W))
    sample = a[int(0.03 * H): int(0.30 * H), int(0.02 * W): sx1].reshape(-1, 3)
    gain = np.clip(WALL / np.median(sample, axis=0), 0.8, 1.35)
    a = np.clip(a * gain, 0, 255)

    side = max(by1 - by0, bx1 - bx0) / FILL
    cx = (bx0 + bx1) / 2
    left, top = round(cx - side / 2), round(by1 - BASE * side)
    side = round(side)

    pad_t, pad_b = max(0, -top), max(0, top + side - H)
    pad_l, pad_r = max(0, -left), max(0, left + side - W)
    if pad_l or pad_r:
        a = np.pad(a, ((0, 0), (pad_l, pad_r), (0, 0)), mode="reflect")
        left += pad_l; W = a.shape[1]
    if pad_b:  # shelf: a mirrored strip reads as a slightly glossy surface
        a = np.concatenate([a, a[-pad_b - 1:-1][::-1]], axis=0)
    if pad_t:
        bl, br = max(int(bx0 + pad_l - 0.02 * W), 0), min(int(bx1 + pad_l + 0.02 * W), W)
        a = np.concatenate([wall_above(a, pad_t, bl, br, by0), a], axis=0)
        top += pad_t

    crop = Image.fromarray(a[top: top + side, left: left + side].astype(np.uint8))
    crop = crop.resize((SIZE, SIZE), Image.LANCZOS)
    os.makedirs(DST, exist_ok=True)
    out = f"{DST}/{pid}.jpg"
    crop.save(out, quality=82, optimize=True, progressive=True)
    return out, (pad_t, pad_b, pad_l, pad_r), side

if __name__ == "__main__":
    for name, (pid, *box) in BOXES.items():
        out, pads, side = process(name, pid, *box)
        print(f"{name} -> {os.path.basename(out):34s} side={side:5d} pad(t,b,l,r)={pads} {os.path.getsize(out)//1024}KB")
