"""Prepare deck imagery from the original NVIMC profile.

Crops every photo to the exact aspect ratio it is placed at (so nothing is
stretched in PowerPoint), builds a white-wordmark logo for dark slides, and
normalises team portraits to square greyscale crops.

Usage: python build/prep_images.py <unzipped-original-pptx-dir>
"""
import os
import sys

from PIL import Image, ImageEnhance, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "assets")
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
    "p_azzam.jpg": ("image27.jpeg", 0.30, 3.6 / 3.0),
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

# Logos. The supplied PNG has an opaque white background, so neutral (grey)
# pixels are converted to black-with-alpha ("colour to alpha"); saturated brand
# colours stay fully opaque so they don't shift on dark slides.
src_logo = Image.open(os.path.join(ROOT, "Company Logo (NVIMC).png")).convert("RGBA")
logo = Image.new("RGBA", src_logo.size)
rev = Image.new("RGBA", src_logo.size)
sp, lp, rp = src_logo.load(), logo.load(), rev.load()
for y in range(src_logo.height):
    for x in range(src_logo.width):
        r, g, b, a = sp[x, y]
        if max(r, g, b) - min(r, g, b) < 40:
            alpha = int((255 - min(r, g, b)) * a / 255)
            lp[x, y] = (0, 0, 0, alpha)
            rp[x, y] = (255, 255, 255, alpha)
        else:
            lp[x, y] = rp[x, y] = (r, g, b, a)
logo.save(os.path.join(OUT, "logo.png"))
rev.save(os.path.join(OUT, "logo_white.png"))
# Mark only (the stripes, without the wordmark) for small motifs.
mark = logo.crop((225, 0, 775, 292))
mark.save(os.path.join(OUT, "logo_mark.png"))

print("prepared", len(os.listdir(OUT)), "assets in", OUT)
