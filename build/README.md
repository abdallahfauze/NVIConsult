# Company profile build

Generates the NVIMC company profile in three themes, each in English and Arabic
(the Arabic decks are the same layouts mirrored right-to-left):

| Theme | Script | Assets | Output |
|---|---|---|---|
| Minimal (portfolio-deck light) | `build.js` | `prep_images.py` → `assets/` | `NVIMC Company Profile - Minimal (EN/AR).pptx` |
| Bold (dark/colour, logo palette) | `build_bold.js` | `prep_bold.py` → `assets_bold/` | `NVIMC Company Profile - Bold (EN/AR).pptx` |
| Dark (sleek / futuristic) | `build_dark.js` | `prep_dark.py` → `assets_dark/` (derived from `assets/`) | `NVIMC Company Profile - Dark (EN/AR).pptx` |

All themes read the same `content.js`, so every line of copy is identical.

```bash
# 1. unzip the original deck and prepare images
python3 -c "import zipfile; zipfile.ZipFile('Company Profile NVIMC V1.pptx').extractall('/tmp/v1')"
python3 build/prep_images.py /tmp/v1
python3 build/prep_bold.py /tmp/v1
python3 build/prep_dark.py            # after prep_images.py

# 2. build all four decks
cd build && npm install && cd ..
for l in en ar; do node build/build.js $l; node build/build_bold.js $l; node build/build_dark.js $l; done
```

## Fonts

All themes follow the portfolio deck's typography: **Cinzel** (titles),
**Century Gothic** (body), **Bahnschrift** (sub-heads) and **Consolas**
(numerals, labels). Century Gothic, Bahnschrift and Consolas ship with
Windows/Office; Cinzel is a free Google Font and must be installed on any
machine that edits or presents the decks. Arabic text uses **Segoe UI**.

Export PDFs from PowerPoint on a machine with these fonts installed so the
PDFs match the design exactly.
