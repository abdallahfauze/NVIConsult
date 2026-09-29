"""Prepare imagery for the BOLD theme (build_bold.js) from the original NVIMC profile.

Crops every photo to the exact aspect ratio it is placed at (so nothing is
stretched in PowerPoint), builds a white-wordmark logo for dark slides, and
normalises team portraits to square greyscale crops.

Usage: python build/prep_bold.py <unzipped-original-pptx-dir>
"""
import os
import sys

from PIL import Image, ImageEnhance, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "assets_bold")
os.makedirs(OUT, exist_ok=True)

media = os.path.join(sys.argv[1], "ppt", "media")


# Some source photos carry a baked-in frame; trim that fraction off each edge.
TRIM = {"image25.jpeg": 0.06, "image28.jpeg": 0.05}


def trim(im, name):
    t = TRIM.get(name, 0)
    if t:
        w, h = im.size
        im = im.crop((int(w * t), int(h * t), int(w * (1 - t)), int(h * (1 - t))))
    return im


def src(name):
    return trim(Image.open(os.path.join(media, name)).convert("RGB"), name)


def cover(im, w, h, fx=0.5, fy=0.5):
    """Centre-crop `im` to aspect w:h, with focal point (fx, fy)."""
    target = w / h
    iw, ih = im.size
    if iw / ih > target:
        nw = int(ih * target)
        x = int((iw - nw) * fx)
        im = im.crop((x, 0, x + nw, ih))
    else:
        nh = int(iw / target)
        y = int((ih - nh) * fy)
        im = im.crop((0, y, iw, y + nh))
    return im


def save(im, name, w, h, fx=0.5, fy=0.5, max_px=1800):
    im = cover(im, w, h, fx, fy)
    if im.width > max_px:
        im = im.resize((max_px, int(max_px * h / w)), Image.LANCZOS)
    im.save(os.path.join(OUT, name), quality=88)


# name: (source, aspect w, aspect h, fx, fy)
CROPS = {
    "cover.jpg": ("image1.jpeg", 8.133, 7.5, 0.45, 0.5),
    "about.jpg": ("image11.jpeg", 5.6, 7.5, 0.6, 0.5),
    "vision.jpg": ("image32.jpeg", 4.6, 7.5, 0.5, 0.5),
    "contact.jpg": ("image9.jpeg", 13.333, 7.5, 0.5, 0.5),
    # service tiles (overview grid)
    "t_eng.jpg": ("image13.jpeg", 2.846, 1.6, 0.5, 0.55),
    "t_str.jpg": ("image17.jpeg", 2.846, 1.6, 0.5, 0.45),
    "t_fit.jpg": ("image14.jpeg", 2.846, 1.6, 0.5, 0.5),
    "t_ele.jpg": ("image18.jpeg", 2.846, 1.6, 0.5, 0.5),
    "t_low.jpg": ("image20.jpeg", 2.846, 1.6, 0.5, 0.45),
    "t_mec.jpg": ("image23.jpeg", 2.846, 1.6, 0.5, 0.5),
    "t_plu.jpg": ("image25.jpeg", 2.846, 1.6, 0.5, 0.6),
    "t_mnt.jpg": ("image12.jpeg", 2.846, 1.6, 0.5, 0.3),
    # service detail slides
    "s_eng.jpg": ("image13.jpeg", 4.2, 7.5, 0.5, 0.5),
    "s_str_a.jpg": ("image16.jpeg", 3.75, 6.3, 0.5, 0.5),
    "s_str_b.jpg": ("image17.jpeg", 3.75, 6.3, 0.5, 0.5),
    "s_fit_a.jpg": ("image14.jpeg", 5.53, 3.2, 0.5, 0.5),
    "s_fit_b.jpg": ("image15.jpeg", 2.665, 2.9, 0.5, 0.5),
    "s_fit_c.jpg": ("image24.jpeg", 2.665, 2.9, 0.5, 0.5),
    "s_ele.jpg": ("image18.jpeg", 5.2, 3.7, 0.5, 0.5),
    "s_ele_b.jpg": ("image19.jpeg", 5.2, 3.7, 0.5, 0.45),
    "s_low.jpg": ("image21.jpeg", 13.333, 7.5, 0.5, 0.5),
    "s_mec.jpg": ("image23.jpeg", 5.4, 7.5, 0.5, 0.5),
    "s_plu.jpg": ("image25.jpeg", 5.0, 7.5, 0.5, 0.5),
    "s_mnt.jpg": ("image26.jpeg", 13.333, 7.5, 0.5, 0.5),
    "clients.jpg": ("image6.jpeg", 13.333, 3.2, 0.5, 0.5),
}

for name, (s, w, h, fx, fy) in CROPS.items():
    save(src(s), name, w, h, fx, fy)

# Team portraits -> square greyscale, face-weighted towards the top.
# Positions follow the original team slide: each photo sits in the same
# column as the name and experience line printed beneath it.
TEAM = {
    "p_hazem.jpg": ("image29.jpeg", 0.20, 1.0),
    "p_mohammad.jpg": ("image30.png", 0.25, 1.0),
    "p_nader.jpg": ("image28.jpeg", 0.30, 1.0),
    "p_anas.jpg": ("image31.jpeg", 0.25, 1.0),
}
for name, (s, fy, aspect) in TEAM.items():
    im = Image.open(os.path.join(media, s))
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[3])
        im = bg
    im = cover(trim(im.convert("RGB"), s), aspect, 1, 0.5, fy)
    im = im.resize((int(600 * aspect), 600), Image.LANCZOS)
    im = ImageOps.grayscale(im)
    im = ImageOps.autocontrast(im, cutoff=1)
    im = ImageEnhance.Contrast(im).enhance(1.05)
    im.save(os.path.join(OUT, name), quality=90)

# General Manager: supplied studio portrait, cropped to the feature card.
im = cover(Image.open(os.path.join(ROOT, "Azzam Pic.jpg")).convert("RGB"), 3.6, 3.0, 0.5, 0.25)
im = ImageOps.autocontrast(ImageOps.grayscale(im.resize((720, 600), Image.LANCZOS)), cutoff=1)
im.save(os.path.join(OUT, "p_azzam.jpg"), quality=90)

# Logos: the supplied JPGs sit on white. Neutral pixels become black (or, for
# dark slides, white) with alpha; saturated brand colours stay fully opaque.
def cutout(path, out, white=None):
    im = Image.open(path).convert("RGB")
    res = Image.new("RGBA", im.size)
    rev = Image.new("RGBA", im.size)
    sp, rp, vp = im.load(), res.load(), rev.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = sp[x, y]
            if max(r, g, b) - min(r, g, b) < 40:
                a = 255 - min(r, g, b)
                a = 0 if a < 12 else a
                rp[x, y] = (0, 0, 0, a)
                vp[x, y] = (255, 255, 255, a)
            else:
                rp[x, y] = vp[x, y] = (r, g, b, 255)
    box = res.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    res.crop(box).save(os.path.join(OUT, out))
    if white:
        rev.crop(box).save(os.path.join(OUT, white))


cutout(os.path.join(ROOT, "Logo.jpg"), "logo.png", "logo_white.png")
cutout(os.path.join(ROOT, "Logo without Text.jpg"), "logo_mark.png")

print("prepared", len(os.listdir(OUT)), "assets in", OUT)
