# Company profile build

Generates the redesigned NVIMC company profile in English and Arabic from the
original V1 deck's imagery.

```bash
# 1. unzip the original deck and prepare images (crops, logo cut-outs, portraits)
python3 -c "import zipfile; zipfile.ZipFile('Company Profile NVIMC V1.pptx').extractall('/tmp/v1')"
python3 build/prep_images.py /tmp/v1

# 2. build both decks
cd build && npm install && cd ..
node build/build.js en
node build/build.js ar
```

- `content.js` holds every line of copy (EN + AR), so wording changes don't touch layout.
- `build.js` holds the layout; the Arabic deck is the same layout mirrored right-to-left.

## Fonts

The decks follow the portfolio deck's typography: **Cinzel** (section titles),
**Century Gothic** (body), **Bahnschrift** (sub-heads) and **Consolas**
(numerals, labels). Century Gothic, Bahnschrift and Consolas ship with
Windows/Office; Cinzel is a free Google Font and must be installed on any
machine that edits or presents the deck. Arabic text uses **Segoe UI**.

Export PDFs from PowerPoint on a machine with these fonts installed so the
PDF matches the design exactly.
