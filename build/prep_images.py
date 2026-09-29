"""Prepare deck imagery for the NVIMC company profile.

- Crops every photo to the exact aspect ratio it is placed at (nothing is
  stretched in PowerPoint) and gives all photos one muted colour grade so the
  mixed stock imagery reads as a single set.
- Cuts the supplied logo JPGs out of their white background.
- Normalises team portraits to greyscale.
- Traces a faint architectural line drawing (from the cover skyline photo)
  used as the page texture on the cover and closing slides.

Usage: python build/prep_images.py <unzipped-original-pptx-dir>
"""
import os
import sys

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "assets")
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))

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


def grade(im):
    """One quiet grade for every photo: less saturation, slightly softer contrast."""
    im = ImageEnhance.Color(im).enhance(0.6)
    im = ImageEnhance.Contrast(im).enhance(0.94)
    return ImageEnhance.Brightness(im).enhance(1.02)


def save(im, name, w, h, fx=0.5, fy=0.5, max_px=1800):
    im = grade(cover(im, w, h, fx, fy))
    if im.width > max_px:
        im = im.resize((max_px, int(max_px * h / w)), Image.LANCZOS)
    im.save(os.path.join(OUT, name), quality=88)


PANEL = (4.6, 7.5)   # right-hand photo panel on content slides
TILE = (2.808, 1.75)  # services overview tiles

# name: (source, aspect w, aspect h, fx, fy)
CROPS = {
    "cover.jpg": ("image1.jpeg", 6.333, 7.5, 0.4, 0.5),
    "about.jpg": ("image11.jpeg", 5.53, 3.6, 0.6, 0.55),
    "vision.jpg": ("image32.jpeg", *PANEL, 0.5, 0.5),
    "clients.jpg": ("image9.jpeg", 12.133, 2.6, 0.5, 0.45),
    # services overview
    "t_eng.jpg": ("image13.jpeg", *TILE, 0.5, 0.55),
    "t_str.jpg": ("image17.jpeg", *TILE, 0.5, 0.45),
    "t_fit.jpg": ("image14.jpeg", *TILE, 0.5, 0.5),
    "t_ele.jpg": ("image18.jpeg", *TILE, 0.5, 0.5),
    "t_low.jpg": ("image20.jpeg", *TILE, 0.5, 0.45),
    "t_mec.jpg": ("image23.jpeg", *TILE, 0.5, 0.5),
    "t_plu.jpg": ("image25.jpeg", *TILE, 0.5, 0.6),
    "t_mnt.jpg": ("image12.jpeg", *TILE, 0.5, 0.3),
    # service slide panels
    "s_eng.jpg": ("image13.jpeg", *PANEL, 0.5, 0.5),
    "s_str.jpg": ("image17.jpeg", *PANEL, 0.5, 0.5),
    "s_fit.jpg": ("image14.jpeg", *PANEL, 0.62, 0.5),
    "s_ele.jpg": ("image19.jpeg", *PANEL, 0.6, 0.5),
    "s_low.jpg": ("image20.jpeg", *PANEL, 0.5, 0.5),
    "s_mec.jpg": ("image23.jpeg", *PANEL, 0.5, 0.5),
    "s_plu.jpg": ("image25.jpeg", *PANEL, 0.5, 0.5),
    "s_mnt.jpg": ("image12.jpeg", *PANEL, 0.35, 0.5),
    # in-slide supporting photos
    "fit_b.jpg": ("image15.jpeg", 3.565, 2.1, 0.5, 0.5),
    "fit_c.jpg": ("image24.jpeg", 3.565, 2.1, 0.5, 0.55),
    "str_b.jpg": ("image16.jpeg", 3.615, 4.55, 0.5, 0.5),
}

for name, (s, w, h, fx, fy) in CROPS.items():
    save(src(s), name, w, h, fx, fy)


# Team portraits -> greyscale, portrait crop, face-weighted towards the top.
# Positions follow the original team slide: each photo sits in the same
# column as the name and experience line printed beneath it.
def portrait(im, name, aspect, fy, out):
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[3])
        im = bg
    im = cover(trim(im.convert("RGB"), name), aspect, 1, 0.5, fy)
    im = im.resize((int(700 * aspect), 700), Image.LANCZOS)
    im = ImageOps.grayscale(im)
    im = ImageOps.autocontrast(im, cutoff=1)
    im.save(os.path.join(OUT, out), quality=90)


portrait(Image.open(os.path.join(ROOT, "Azzam Pic.jpg")), "", 3.2 / 3.9, 0.3, "p_azzam.jpg")
TEAM = {
    "p_hazem.jpg": ("image29.jpeg", 0.20),
    "p_mohammad.jpg": ("image30.png", 0.25),
    "p_nader.jpg": ("image28.jpeg", 0.30),
    "p_anas.jpg": ("image31.jpeg", 0.25),
}
for out, (s, fy) in TEAM.items():
    portrait(Image.open(os.path.join(media, s)), s, 1.9 / 2.3, fy, out)


# Logos: the supplied JPGs sit on white. Neutral pixels become black with
# alpha ("colour to alpha"); saturated brand colours stay fully opaque.
def cutout(path, out):
    im = Image.open(path).convert("RGB")
    res = Image.new("RGBA", im.size)
    sp, rp = im.load(), res.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = sp[x, y]
            if max(r, g, b) - min(r, g, b) < 40:
                a = 255 - min(r, g, b)
                rp[x, y] = (0, 0, 0, 0 if a < 12 else a)
            else:
                rp[x, y] = (r, g, b, 255)
    res = res.crop(res.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox())
    res.save(os.path.join(OUT, out))
    print(out, res.size)


cutout(os.path.join(ROOT, "Logo.jpg"), "logo.png")
cutout(os.path.join(ROOT, "Logo without Text.jpg"), "logo_mark.png")

# Faint architectural linework traced from the cover skyline.
sky = Image.open(os.path.join(media, "image1.jpeg")).convert("L")
sky = cover(sky, 13.333, 7.5).resize((2000, 1125), Image.LANCZOS)
edges = sky.filter(ImageFilter.GaussianBlur(1.2)).filter(ImageFilter.FIND_EDGES)
edges = ImageOps.autocontrast(edges, cutoff=2).point(lambda v: 0 if v < 70 else min(255, v))
lines = Image.new("RGBA", edges.size, (60, 66, 76, 0))
lines.putalpha(edges.point(lambda v: int(v * 0.16)))
lines.save(os.path.join(OUT, "linework.png"))

print("prepared", len(os.listdir(OUT)), "assets in", OUT)
