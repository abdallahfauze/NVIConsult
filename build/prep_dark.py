"""Prepare imagery for the DARK theme (build_dark.js).

Derives everything from the Minimal theme's prepared assets (build/assets/, run
prep_images.py first) so the three themes use identical crops:

- photos get a darker, cooler grade;
- full-height panel photos fade to transparent on their inner edge (PNG; a
  left-fading and a right-fading variant, for the mirrored Arabic deck);
- the logo gets a white wordmark, the linework is redrawn in light strokes;
- a page background is generated: near-black with faint violet/cyan glows and a
  fine technical grid.

Usage: python build/prep_dark.py
"""
import os

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "assets")
OUT = os.path.join(HERE, "assets_dark")
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))

BG = (11, 13, 18)  # page colour, keep in sync with C.bg in build_dark.js

# Photos that fill a full-height side panel and should melt into the page.
PANELS = {"cover.jpg", "vision.jpg"} | {f for f in os.listdir(SRC) if f.startswith("s_")}


def dark_grade(im):
    im = ImageEnhance.Color(im).enhance(0.75)
    im = ImageEnhance.Brightness(im).enhance(0.78)
    im = ImageEnhance.Contrast(im).enhance(1.08)
    tint = Image.new("RGB", im.size, (20, 40, 70))
    return Image.blend(im, tint, 0.12)


def fade(im, side, frac=0.42):
    """Fade `frac` of the image width on `side` to transparent, so the panel
    melts into whatever glow sits behind it."""
    w, h = im.size
    band = int(w * frac)
    alpha = Image.new("L", (w, h), 255)
    d = ImageDraw.Draw(alpha)
    for i in range(band):
        a = int(255 * (i / band) ** 1.4)
        x = i if side == "left" else w - 1 - i
        d.line([(x, 0), (x, h)], fill=a)
    out = im.convert("RGBA")
    out.putalpha(alpha)
    return out


for f in os.listdir(SRC):
    p = os.path.join(SRC, f)
    if f.endswith(".jpg") and not f.startswith("p_"):
        im = dark_grade(Image.open(p).convert("RGB"))
        if f in PANELS:
            if im.width > 1000:
                im = im.resize((1000, int(1000 * im.height / im.width)), Image.LANCZOS)
            fade(im, "left").save(os.path.join(OUT, f.replace(".jpg", ".png")), optimize=True)
            fade(im, "right").save(os.path.join(OUT, f.replace(".jpg", "_r.png")), optimize=True)
        else:
            im.save(os.path.join(OUT, f), quality=88)
    elif f.startswith("p_"):
        im = Image.open(p).convert("L")
        ImageEnhance.Brightness(im).enhance(0.92).save(os.path.join(OUT, f), quality=90)

# Logo with white wordmark; the colour mark is used as-is.
logo = Image.open(os.path.join(SRC, "logo.png")).convert("RGBA")
px = logo.load()
for y in range(logo.height):
    for x in range(logo.width):
        r, g, b, a = px[x, y]
        if a and max(r, g, b) < 60:
            px[x, y] = (255, 255, 255, a)
logo.save(os.path.join(OUT, "logo_white.png"))
Image.open(os.path.join(SRC, "logo_mark.png")).save(os.path.join(OUT, "logo_mark.png"))

# Linework in light strokes.
lw = Image.open(os.path.join(SRC, "linework.png")).convert("RGBA")
alpha = lw.getchannel("A").point(lambda v: min(255, int(v * 0.9)))
light = Image.new("RGBA", lw.size, (170, 200, 230, 0))
light.putalpha(alpha)
light.save(os.path.join(OUT, "linework.png"))

# Page background: near-black, two soft glows, fine grid.
W, H = 2000, 1125
bg = Image.new("RGB", (W, H), BG)
glow = Image.new("RGB", (W, H), (0, 0, 0))
g = ImageDraw.Draw(glow)
g.ellipse([-500, -650, 900, 550], fill=(52, 40, 110))    # violet, top-left
g.ellipse([1300, 650, 2600, 1750], fill=(10, 70, 100))   # cyan, bottom-right
glow = glow.filter(ImageFilter.GaussianBlur(260))
bg = Image.fromarray(__import__("numpy").clip(
    __import__("numpy").asarray(bg, dtype="int16") + __import__("numpy").asarray(glow, dtype="int16") * 0.55, 0, 255
).astype("uint8"))
grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(grid)
step = 50
for x in range(0, W, step):
    gd.line([(x, 0), (x, H)], fill=(255, 255, 255, 7))
for y in range(0, H, step):
    gd.line([(0, y), (W, y)], fill=(255, 255, 255, 7))
bg = Image.alpha_composite(bg.convert("RGBA"), grid).convert("RGB")
bg.save(os.path.join(OUT, "bg.jpg"), quality=92)
# Mirrored background for the Arabic deck, so the glows follow the layout.
bg.transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(OUT, "bg_r.jpg"), quality=92)

print("prepared", len(os.listdir(OUT)), "assets in", OUT)
