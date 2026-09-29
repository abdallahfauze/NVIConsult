// NVIMC company profile generator — BOLD theme (dark/colour, logo palette).
// Same content, fonts and assets as the Minimal theme (build.js); only the styling differs.
//   node build/build_bold.js en   -> NVIMC Company Profile - Bold (EN).pptx
//   node build/build_bold.js ar   -> NVIMC Company Profile - Bold (AR).pptx  (mirrored, right-to-left)
// Run build/prep_bold.py first to populate build/assets_bold/.

const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const RDS = require("react-dom/server");
const sharp = require("sharp");
const md = require("react-icons/md");

const LANG = process.argv[2] || "en";
const RTL = LANG === "ar";
const T_ = require("./content")[LANG];
const OUT_DIR = path.join(__dirname, "..");
const A = (p) => path.join(__dirname, "assets_bold", p);

const SW = 13.333, SH = 7.5, M = 0.6;
// Portfolio typography (same as the Minimal theme). Arabic runs use Segoe UI.
const F = { title: "Cinzel", sub: "Bahnschrift", body: "Century Gothic", mono: "Consolas", ar: "Segoe UI" };
const AR_RE = /[\u0600-\u06FF]/;
// Role by usage: explicit fontFace wins; bare numerals and letter-spaced labels
// are mono; bold short text is a sub-head; everything else is body.
function fontFor(o, text) {
  if (RTL && AR_RE.test(text)) return F.ar;
  if (o.fontFace) return o.fontFace;
  if (/^[\d\s+.\/]+$/.test(text.trim())) return F.mono;
  if (o.charSpacing) return F.mono;
  if (o.bold) return F.sub;
  return F.body;
}
const C = {
  ink: "0E1420", ink2: "182131", slate: "667080", body: "3F4856", mute: "B4BDC9",
  line: "DDE1E6", soft: "F2F4F7", white: "FFFFFF",
  // logo palette
  yel: "FBBA16", mag: "E5177B", plum: "98207E", cya: "2DB8E0", vio: "5B54A4",
};
const BRAND = [C.mag, C.cya, C.yel, C.vio, C.plum];
// text colour that stays legible on each brand fill
const ON = { [C.yel]: C.ink, [C.cya]: C.ink, [C.mag]: C.white, [C.vio]: C.white, [C.plum]: C.white };
// darker variants for brand-coloured text on white
const TXT = { [C.yel]: "C98F00", [C.cya]: "1A93B8", [C.mag]: C.mag, [C.vio]: C.vio, [C.plum]: C.plum };

// ---------- mirroring helpers (Arabic deck flips horizontally) ----------
const mx = (x, w) => (RTL ? SW - x - w : x);
const al = (a) => (!RTL ? a : a === "left" ? "right" : a === "right" ? "left" : a);
const up = (t) => (RTL ? t : t.toUpperCase());
const RTLOPT = RTL ? { rtlMode: true, lang: "ar-SA" } : {};

function styleRun(o, text) {
  const r = { ...o, fontFace: fontFor(o, text), ...RTLOPT };
  if (RTL && AR_RE.test(text)) {
    delete r.charSpacing;
    // Arabic glyphs read smaller than Latin at the same size; lift the small labels.
    if (r.fontSize && r.fontSize <= 12) r.fontSize = Math.round(r.fontSize * 1.15 * 10) / 10;
  }
  return r;
}
function T(s, text, o) {
  const plain = Array.isArray(text) ? text.map((r) => r.text).join("") : text;
  const opt = styleRun({ margin: 0, valign: "top", isTextBox: true, ...o }, plain);
  opt.x = mx(o.x, o.w);
  opt.align = al(o.align || "left");
  if (Array.isArray(text)) {
    text = text.map((r) => {
      const ro = styleRun({ ...(r.options || {}) }, r.text);
      if (RTL) ro.align = opt.align;
      return { text: r.text, options: ro };
    });
  }
  s.addText(text, opt);
}
function R(s, shape, o) {
  s.addShape(shape, { ...o, x: mx(o.x, o.w) });
}
function IMG(s, src, o) {
  const opt = { ...o, x: mx(o.x, o.w) };
  if (src.startsWith("image/")) opt.data = src; else opt.path = A(src);
  s.addImage(opt);
}

// ---------- icons ----------
const ICON_CACHE = {};
async function icon(name, color) {
  const key = name + color;
  if (ICON_CACHE[key]) return ICON_CACHE[key];
  const Comp = md[name] || md.MdCheckCircle;
  if (!md[name]) console.warn("missing icon", name);
  const svg = RDS.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return (ICON_CACHE[key] = "image/png;base64," + buf.toString("base64"));
}

// ---------- recurring pieces ----------
let pres;
const PARA = () => pres.shapes.PARALLELOGRAM;

// the four logo stripes as a compact brand glyph
function glyph(s, x, y, h = 0.2) {
  IMG(s, "logo_mark.png", { x, y, w: h * (969 / 536), h });
}
function eyebrow(s, text, x, y, w, dark) {
  glyph(s, x, y + 0.03, 0.19);
  T(s, up(text), {
    x: x + 0.5, y, w: w - 0.5, h: 0.28, fontSize: 11, bold: true, charSpacing: 3,
    color: dark ? C.cya : C.mag, valign: "middle",
  });
}
function chip(s, x, y, w, h, color) {
  R(s, PARA(), { x, y, w, h, fill: { color }, line: { color, width: 0 } });
}
function title(s, text, o, dark) {
  T(s, text, { fontFace: F.title, fontSize: 36, bold: true, color: dark ? C.white : C.ink, valign: "top", ...o });
}
function footer(s, n, dark, x = M, w = SW - 2 * M) {
  const col = dark ? "8D97A5" : C.slate;
  T(s, up(T_.footer), { x, y: 7.05, w: w - 0.6, h: 0.25, fontSize: 8.5, charSpacing: 2, color: col, valign: "middle" });
  T(s, String(n).padStart(2, "0"), { x: x + w - 0.6, y: 7.05, w: 0.6, h: 0.25, fontSize: 9, bold: true, color: col, align: "right", valign: "middle" });
}
function shadow() {
  return { type: "outer", color: "0E1420", blur: 10, offset: 2, angle: 90, opacity: 0.12 };
}
function serviceHeader(s, i, x, y, w, dark, titleSize = 30, titleH = 0.75) {
  const color = BRAND[i % BRAND.length];
  chip(s, x, y + 0.06, 0.34, 0.16, color);
  T(s, up(`${T_.services.serviceLabel} 04.${i + 1}`), {
    x: x + 0.5, y, w: w - 0.5, h: 0.28, fontSize: 11, bold: true, charSpacing: 3,
    color: dark ? C.cya : TXT[color], valign: "middle",
  });
  title(s, T_[SERVICE_KEYS[i]].title, { x, y: y + 0.38, w, h: titleH, fontSize: titleSize, valign: "top" }, dark);
  return color;
}
const SERVICE_KEYS = ["eng", "str", "fit", "ele", "low", "mec", "plu", "mnt"];

// ======================================================================
async function build() {
  pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "New Vision Integral for Maintenance and Contracting"; // pptxgenjs does not escape & in docProps
  pres.company = "New Vision Integral for Maintenance and Contracting";
  pres.title = RTL ? "ملف الشركة" : "Company Profile";
  if (RTL) pres.rtlMode = true;
  let n = 0;

  // ---------------- 1. COVER ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.white };
    const c = T_.cover;
    IMG(s, "cover.jpg", { x: 5.2, y: 0, w: SW - 5.2, h: SH });
    R(s, pres.shapes.RECTANGLE, { x: 5.2, y: 0, w: SW - 5.2, h: SH, fill: { color: C.ink, transparency: 38 }, line: { width: 0, color: C.ink } });
    IMG(s, "logo.png", { x: 0.8, y: 0.95, w: 3.6, h: 3.6 * (816 / 1264) });
    eyebrow(s, c.eyebrow, 0.8, 3.95, 4.0, false);
    T(s, [
      { text: c.name, options: { fontSize: 22, bold: true, color: C.ink, breakLine: true } },
      { text: c.legal, options: { fontSize: 16, color: C.body } },
    ], { x: 0.8, y: 4.35, w: 4.1, h: 1.0 });
    T(s, c.lines, { x: 0.8, y: 5.4, w: 4.1, h: 0.6, fontSize: 10, color: C.slate });
    T(s, c.location, { x: 0.8, y: 6.45, w: 4.1, h: 0.3, fontSize: 11, color: C.slate });
    T(s, c.web, { x: 0.8, y: 6.75, w: 4.1, h: 0.3, fontSize: 11, bold: true, color: C.mag });
    [C.yel, C.mag, C.cya, C.vio].forEach((col, i) => chip(s, 6.0 + i * 0.52, 2.0, 0.42, 0.16, col));
    T(s, c.headline, { x: 6.0, y: 2.4, w: 6.8, h: 2.4, fontSize: 60, bold: true, color: C.white, lineSpacingMultiple: 0.95 });
    T(s, c.sub, { x: 6.0, y: 4.95, w: 6.3, h: 0.9, fontSize: 18, color: "DCE3EA" });
  }

  // ---------------- 2. ABOUT ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.white };
    const a = T_.about;
    IMG(s, "about.jpg", { x: SW - 5.6, y: 0, w: 5.6, h: SH });
    const x = M, w = 6.7;
    eyebrow(s, a.eyebrow, x, 0.65, w);
    title(s, a.title, { x, y: 1.05, w, h: 1.25, fontSize: 25 });
    T(s, a.body, { x, y: 2.5, w, h: 2.1, fontSize: 14.5, color: C.body, lineSpacingMultiple: 1.15 });
    a.stats.forEach(([num, label], i) => {
      const cx = x + (i % 2) * 3.4, cy = 4.8 + Math.floor(i / 2) * 1.1;
      const col = [C.mag, C.cya, C.yel, C.vio][i];
      chip(s, cx, cy + 0.05, 0.36, 0.14, col);
      T(s, num, { x: cx, y: cy + 0.25, w: 3.2, h: 0.55, fontSize: 32, bold: true, color: C.ink, valign: "middle" });
      T(s, up(label), { x: cx, y: cy + 0.8, w: 3.2, h: 0.25, fontSize: 10, bold: true, charSpacing: 2, color: C.slate });
    });
    footer(s, n, false, x, w);
  }

  // ---------------- 3. PURPOSE ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.white };
    const p = T_.purpose;
    IMG(s, "vision.jpg", { x: 0, y: 0, w: 4.6, h: SH });
    const x = 5.2, w = SW - x - M;
    eyebrow(s, p.eyebrow, x, 0.65, w);
    title(s, p.title, { x, y: 1.05, w, h: 0.7, fontSize: 34 });
    const colW = (w - 0.4) / 2;
    [[p.visionLabel, p.vision, C.mag], [p.missionLabel, p.mission, C.vio]].forEach(([lab, txt, col], i) => {
      const cx = x + i * (colW + 0.4);
      chip(s, cx, 2.12, 0.34, 0.14, col);
      T(s, up(lab), { x: cx + 0.5, y: 2.05, w: colW - 0.5, h: 0.28, fontSize: 12, bold: true, charSpacing: 2, color: TXT[col], valign: "middle" });
      T(s, txt, { x: cx, y: 2.5, w: colW, h: 1.9, fontSize: 15, color: C.ink, lineSpacingMultiple: 1.15 });
    });
    T(s, up(p.valuesLabel), { x, y: 4.75, w, h: 0.28, fontSize: 12, bold: true, charSpacing: 2, color: C.slate, valign: "middle" });
    const vw = (w - 3 * 0.2) / 4;
    p.values.forEach((v, i) => {
      const cx = x + i * (vw + 0.2), col = [C.mag, C.cya, C.yel, C.vio][i];
      R(s, pres.shapes.RECTANGLE, { x: cx, y: 5.2, w: vw, h: 1.55, fill: { color: C.soft }, line: { width: 0, color: C.soft } });
      chip(s, cx + 0.22, 5.42, 0.3, 0.12, col);
      T(s, v, { x: cx + 0.22, y: 5.7, w: vw - 0.44, h: 0.95, fontSize: 13, bold: true, color: C.ink });
    });
    footer(s, n, false, x, w);
  }

  // ---------------- 4. APPROACH ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.ink };
    const a = T_.approach;
    IMG(s, "logo_mark.png", { x: SW - M - 2.4, y: 0.6, w: 2.4, h: 2.4 * (536 / 969) });
    eyebrow(s, a.eyebrow, M, 0.65, 8, true);
    title(s, a.title, { x: M, y: 1.05, w: 8.6, h: 0.8, fontSize: 40 }, true);
    T(s, a.sub, { x: M, y: 1.95, w: 8.6, h: 1.3, fontSize: 15, color: "C3CBD6", lineSpacingMultiple: 1.15 });
    const icons = ["MdEngineering", "MdChecklist", "MdForum", "MdBuild"];
    const cw = (SW - 2 * M - 3 * 0.25) / 4;
    for (let i = 0; i < 4; i++) {
      const cx = M + i * (cw + 0.25), cy = 3.65, col = [C.mag, C.cya, C.yel, C.vio][i];
      R(s, pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: 3.1, fill: { color: C.ink2 }, line: { width: 0, color: C.ink2 } });
      R(s, pres.shapes.OVAL, { x: cx + 0.35, y: cy + 0.4, w: 0.8, h: 0.8, fill: { color: col }, line: { width: 0, color: col } });
      IMG(s, await icon(icons[i], ON[col]), { x: cx + 0.52, y: cy + 0.57, w: 0.46, h: 0.46 });
      T(s, String(i + 1).padStart(2, "0"), { x: cx + cw - 0.95, y: cy + 0.45, w: 0.6, h: 0.35, fontSize: 12, bold: true, color: "5C6778", align: "right" });
      T(s, a.pillars[i][0], { x: cx + 0.35, y: cy + 1.4, w: cw - 0.7, h: 0.95, fontSize: 17, bold: true, color: C.white });
      T(s, a.pillars[i][1], { x: cx + 0.35, y: cy + 2.4, w: cw - 0.7, h: 0.6, fontSize: 12.5, color: C.mute });
    }
    footer(s, n, true);
  }

  // ---------------- 5. SERVICES OVERVIEW ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.soft };
    const sv = T_.services;
    eyebrow(s, sv.eyebrow, M, 0.55, 8);
    title(s, sv.title, { x: M, y: 0.92, w: SW - 2 * M, h: 0.75, fontSize: 24 });
    const tiles = ["t_eng", "t_str", "t_fit", "t_ele", "t_low", "t_mec", "t_plu", "t_mnt"];
    const cw = (SW - 2 * M - 3 * 0.25) / 4, ih = 1.6, ch = 2.4;
    tiles.forEach((t, i) => {
      const cx = M + (i % 4) * (cw + 0.25), cy = 1.9 + Math.floor(i / 4) * (ch + 0.2);
      const col = BRAND[i % BRAND.length];
      R(s, pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: ch, fill: { color: C.white }, line: { width: 0, color: C.white }, shadow: shadow() });
      IMG(s, t + ".jpg", { x: cx, y: cy, w: cw, h: ih });
      R(s, PARA(), { x: cx + 0.2, y: cy + ih + 0.17, w: 0.62, h: 0.26, fill: { color: col }, line: { width: 0, color: col } });
      T(s, String(i + 1).padStart(2, "0"), { x: cx + 0.2, y: cy + ih + 0.17, w: 0.62, h: 0.26, fontSize: 10.5, bold: true, color: ON[col], align: "center", valign: "middle" });
      T(s, sv.names[i], { x: cx + 0.95, y: cy + ih + 0.1, w: cw - 1.1, h: 0.62, fontSize: 13.5, bold: true, color: C.ink, valign: "middle" });
    });
    footer(s, n, false);
  }

  // ---------------- 6. S01 ENGINEERING & PLANNING ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.white };
    const e = T_.eng;
    IMG(s, "s_eng.jpg", { x: 0, y: 0, w: 4.2, h: SH });
    const x = 4.75, w = SW - x - M;
    serviceHeader(s, 0, x, 0.6, w, false);
    T(s, e.intro, { x, y: 1.78, w, h: 0.5, fontSize: 15, color: C.body });
    const cw = (w - 0.25) / 2, chh = 2.12;
    e.phases.forEach(([ph, items], i) => {
      const cx = x + (i % 2) * (cw + 0.25), cy = 2.5 + Math.floor(i / 2) * (chh + 0.2);
      const col = [C.mag, C.cya, C.yel, C.vio][i];
      R(s, pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: chh, fill: { color: C.soft }, line: { width: 0, color: C.soft } });
      T(s, String(i + 1).padStart(2, "0"), { x: cx + 0.25, y: cy + 0.2, w: 0.7, h: 0.5, fontSize: 26, bold: true, color: TXT[col], valign: "middle" });
      T(s, [
        { text: up(`${e.phaseLabel} ${i + 1}`), options: { fontSize: 9, bold: true, charSpacing: 2, color: C.slate, breakLine: true } },
        { text: ph, options: { fontSize: 15, bold: true, color: C.ink } },
      ], { x: cx + 1.0, y: cy + 0.18, w: cw - 1.2, h: 0.55, valign: "middle" });
      T(s, items.map((it, k) => ({ text: it, options: { bullet: { indent: 12 }, breakLine: k < items.length - 1, paraSpaceAfter: 3 } })), {
        x: cx + 0.25, y: cy + 0.85, w: cw - 0.45, h: chh - 0.95, fontSize: RTL ? 9.5 : 10.5, color: C.body,
      });
    });
    footer(s, n, false, x, w);
  }

  // ---------------- 7. S02 CONTRACTING & STRUCTURE ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.ink };
    const st = T_.str;
    const x = M, w = 3.95;
    serviceHeader(s, 1, x, 0.65, w, true, 34, 1.7);
    T(s, st.intro, { x, y: 2.85, w, h: 1.4, fontSize: 14.5, color: "C3CBD6", lineSpacingMultiple: 1.15 });
    T(s, "35", { x, y: 4.6, w, h: 1.1, fontSize: 72, bold: true, color: C.yel, valign: "middle" });
    T(s, st.statLabel, { x, y: 5.75, w, h: 0.6, fontSize: 13, color: C.white });
    const tw = 3.75;
    [["s_str_a.jpg", st.items[0], C.yel], ["s_str_b.jpg", st.items[1], C.cya]].forEach(([img, lab, col], i) => {
      const tx = 5.0 + i * (tw + 0.23);
      IMG(s, img, { x: tx, y: 0.6, w: tw, h: 6.3 });
      R(s, pres.shapes.RECTANGLE, { x: tx, y: 5.85, w: tw, h: 1.05, fill: { color: C.ink, transparency: 12 }, line: { width: 0, color: C.ink } });
      chip(s, tx + 0.3, 6.1, 0.42, 0.14, col);
      T(s, lab, { x: tx + 0.3, y: 6.3, w: tw - 0.6, h: 0.45, fontSize: 20, bold: true, color: C.white, valign: "middle" });
    });
    footer(s, n, true);
  }

  // ---------------- 8. S03 FIT-OUT & FINISHING ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.white };
    const f = T_.fit;
    const x = M, w = 6.1;
    const col = serviceHeader(s, 2, x, 0.6, w, false, 26);
    T(s, f.intro, { x, y: 1.78, w, h: 0.5, fontSize: 15, color: C.body });
    const colW = 2.9;
    f.items.forEach((it, i) => {
      const cx = x + Math.floor(i / 4) * (colW + 0.3), cy = 2.65 + (i % 4) * 1.0;
      chip(s, cx, cy + 0.1, 0.28, 0.12, [C.mag, C.cya, C.yel, C.vio][i % 4]);
      T(s, it, { x: cx + 0.45, y: cy, w: colW - 0.45, h: 0.55, fontSize: 15, bold: true, color: C.ink, valign: "top" });
      R(s, pres.shapes.LINE, { x: cx, y: cy + 0.82, w: colW, h: 0, line: { color: C.line, width: 0.75 } });
    });
    IMG(s, "s_fit_a.jpg", { x: 7.2, y: 0.6, w: 5.53, h: 3.2 });
    IMG(s, "s_fit_b.jpg", { x: 7.2, y: 4.0, w: 2.665, h: 2.9 });
    IMG(s, "s_fit_c.jpg", { x: 10.065, y: 4.0, w: 2.665, h: 2.9 });
    footer(s, n, false, x, w);
  }

  // ---------------- 9. S04 ELECTRICAL ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.white };
    const e = T_.ele;
    IMG(s, "s_ele.jpg", { x: SW - 5.2, y: 0, w: 5.2, h: 3.7 });
    IMG(s, "s_ele_b.jpg", { x: SW - 5.2, y: 3.8, w: 5.2, h: 3.7 });
    const x = M, w = 6.9;
    const col = serviceHeader(s, 3, x, 0.6, w, false);
    T(s, e.intro, { x, y: 1.78, w, h: 0.5, fontSize: 15, color: C.body });
    e.items.forEach((it, i) => {
      const cy = 2.5 + i * 0.64;
      T(s, String(i + 1).padStart(2, "0"), { x, y: cy, w: 0.6, h: 0.5, fontSize: 13, bold: true, color: TXT[col], valign: "middle" });
      T(s, it, { x: x + 0.75, y: cy, w: w - 0.75, h: 0.5, fontSize: 16, color: C.ink, valign: "middle" });
      R(s, pres.shapes.LINE, { x, y: cy + 0.57, w, h: 0, line: { color: C.line, width: 0.75 } });
    });
    footer(s, n, false, x, w);
  }

  // ---------------- 10. S05 LOW CURRENT ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.ink };
    const l = T_.low;
    IMG(s, "s_low.jpg", { x: 0, y: 0, w: SW, h: SH });
    R(s, pres.shapes.RECTANGLE, { x: 0, y: 0, w: SW, h: SH, fill: { color: C.ink, transparency: 12 }, line: { width: 0, color: C.ink } });
    const x = M, w = 3.7;
    serviceHeader(s, 4, x, 0.65, w, true, 34, 1.3);
    T(s, l.intro, { x, y: 2.5, w, h: 1.4, fontSize: 14.5, color: "C3CBD6", lineSpacingMultiple: 1.15 });
    const icons = ["MdLan", "MdPhoneInTalk", "MdLocalFireDepartment", "MdVideocam", "MdCampaign", "MdLocalHospital",
      "MdFingerprint", "MdAccessTime", "MdApartment", "MdLiveTv", "MdRecordVoiceOver"];
    const gx = 4.75, gw = SW - gx - M, cw = (gw - 3 * 0.2) / 4, ch = (6.25 - 2 * 0.2) / 3;
    for (let i = 0; i < 12; i++) {
      const cx = gx + (i % 4) * (cw + 0.2), cy = 0.65 + Math.floor(i / 4) * (ch + 0.2);
      if (i === 11) {
        R(s, pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: ch, fill: { color: C.cya }, line: { width: 0, color: C.cya } });
        T(s, "11", { x: cx + 0.25, y: cy + 0.2, w: cw - 0.5, h: 0.9, fontSize: 48, bold: true, color: C.ink, valign: "middle" });
        T(s, l.calloutLabel, { x: cx + 0.25, y: cy + 1.1, w: cw - 0.5, h: 0.7, fontSize: 12, bold: true, color: C.ink });
        continue;
      }
      const col = BRAND[i % 4];
      R(s, pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: ch, fill: { color: C.ink2, transparency: 8 }, line: { width: 0.75, color: "2A3547" } });
      IMG(s, await icon(icons[i], col), { x: cx + 0.25, y: cy + 0.3, w: 0.5, h: 0.5 });
      T(s, l.items[i], { x: cx + 0.25, y: cy + 1.0, w: cw - 0.45, h: 0.75, fontSize: 13, bold: true, color: C.white });
    }
    footer(s, n, true);
  }

  // ---------------- 11. S06 MECHANICAL ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.white };
    const m = T_.mec;
    IMG(s, "s_mec.jpg", { x: 0, y: 0, w: 5.4, h: SH });
    const x = 6.0, w = SW - x - M;
    serviceHeader(s, 5, x, 0.6, w, false, 27);
    T(s, m.intro, { x, y: 1.78, w, h: 0.5, fontSize: 15, color: C.body });
    const icons = ["MdAcUnit", "MdAir", "MdHvac", "MdWaterDrop"];
    const cw = (w - 0.25) / 2, ch = 2.05;
    for (let i = 0; i < 4; i++) {
      const cx = x + (i % 2) * (cw + 0.25), cy = 2.55 + Math.floor(i / 2) * (ch + 0.25);
      const col = [C.mag, C.cya, C.yel, C.vio][i];
      R(s, pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: ch, fill: { color: C.soft }, line: { width: 0, color: C.soft } });
      R(s, pres.shapes.OVAL, { x: cx + 0.3, y: cy + 0.3, w: 0.72, h: 0.72, fill: { color: col }, line: { width: 0, color: col } });
      IMG(s, await icon(icons[i], ON[col]), { x: cx + 0.45, y: cy + 0.45, w: 0.42, h: 0.42 });
      T(s, m.items[i], { x: cx + 0.3, y: cy + 1.2, w: cw - 0.6, h: 0.7, fontSize: 15, bold: true, color: C.ink });
    }
    footer(s, n, false, x, w);
  }

  // ---------------- 12. S07 PLUMBING & FIRE FIGHTING ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.white };
    const p = T_.plu;
    IMG(s, "s_plu.jpg", { x: SW - 5.0, y: 0, w: 5.0, h: SH });
    const x = M, w = 7.1;
    serviceHeader(s, 6, x, 0.6, w, false);
    T(s, p.intro, { x, y: 1.78, w, h: 0.5, fontSize: 15, color: C.body });
    const gw = (w - 0.4) / 2;
    const gi = [["MdWaterDrop", C.cya], ["MdLocalFireDepartment", C.mag]];
    for (let g = 0; g < 2; g++) {
      const [name, items] = p.groups[g];
      const gx = x + g * (gw + 0.4), [ic, col] = gi[g];
      R(s, pres.shapes.OVAL, { x: gx, y: 2.6, w: 0.62, h: 0.62, fill: { color: col }, line: { width: 0, color: col } });
      IMG(s, await icon(ic, ON[col]), { x: gx + 0.13, y: 2.73, w: 0.36, h: 0.36 });
      T(s, name, { x: gx + 0.8, y: 2.6, w: gw - 0.8, h: 0.62, fontSize: 19, bold: true, color: C.ink, valign: "middle" });
      items.forEach((it, i) => {
        const cy = 3.5 + i * 0.78;
        chip(s, gx, cy + 0.09, 0.26, 0.11, col);
        T(s, it, { x: gx + 0.42, y: cy, w: gw - 0.42, h: 0.55, fontSize: 14.5, color: C.ink, valign: "top" });
        R(s, pres.shapes.LINE, { x: gx, y: cy + 0.64, w: gw, h: 0, line: { color: C.line, width: 0.75 } });
      });
    }
    footer(s, n, false, x, w);
  }

  // ---------------- 13. S08 FACILITY MAINTENANCE ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.ink };
    const m = T_.mnt;
    IMG(s, "s_mnt.jpg", { x: 0, y: 0, w: SW, h: SH });
    R(s, pres.shapes.RECTANGLE, { x: 0, y: 0, w: SW, h: SH, fill: { color: C.ink, transparency: 10 }, line: { width: 0, color: C.ink } });
    const x = M, w = 4.6;
    serviceHeader(s, 7, x, 0.65, w, true, 38, 1.3);
    T(s, m.intro, { x, y: 2.45, w, h: 1.5, fontSize: 15, color: "C3CBD6", lineSpacingMultiple: 1.15 });
    const icons = ["MdApartment", "MdChair", "MdElectricalServices", "MdSettingsInputComponent", "MdVideocam", "MdAcUnit", "MdPlumbing"];
    const rx = 5.8, rw = SW - rx - M;
    for (let i = 0; i < 7; i++) {
      const cy = 0.65 + i * 0.88, col = BRAND[i % 4];
      R(s, pres.shapes.RECTANGLE, { x: rx, y: cy, w: rw, h: 0.74, fill: { color: C.ink2, transparency: 8 }, line: { width: 0.75, color: "2A3547" } });
      IMG(s, await icon(icons[i], col), { x: rx + 0.25, y: cy + 0.17, w: 0.4, h: 0.4 });
      T(s, m.items[i], { x: rx + 0.9, y: cy, w: rw - 1.6, h: 0.74, fontSize: 16, bold: true, color: C.white, valign: "middle" });
      T(s, String(i + 1).padStart(2, "0"), { x: rx + rw - 0.75, y: cy, w: 0.5, h: 0.74, fontSize: 11, bold: true, color: "6B7688", align: "right", valign: "middle" });
    }
    footer(s, n, true);
  }

  // ---------------- 14. CLIENTS ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.white };
    const c = T_.clients;
    IMG(s, "clients.jpg", { x: 0, y: 0, w: SW, h: 3.2 });
    R(s, pres.shapes.RECTANGLE, { x: 0, y: 0, w: SW, h: 3.2, fill: { color: C.ink, transparency: 22 }, line: { width: 0, color: C.ink } });
    eyebrow(s, c.eyebrow, M, 0.65, 8, true);
    title(s, c.title, { x: M, y: 1.05, w: 10, h: 0.75, fontSize: 36 }, true);
    T(s, c.sub, { x: M, y: 1.85, w: 10, h: 0.4, fontSize: 15, color: "D5DCE4" });
    const cw = (SW - 2 * M - 2 * 0.3) / 3;
    c.list.forEach(([mark, parent], i) => {
      const cx = M + i * (cw + 0.3), cy = 2.7, col = [C.mag, C.cya, C.vio][i];
      R(s, pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: 3.4, fill: { color: C.white }, line: { width: 0.75, color: C.line }, shadow: shadow() });
      chip(s, cx + 0.45, cy + 0.55, 0.4, 0.15, col);
      T(s, up(c.label), { x: cx + 1.0, y: cy + 0.47, w: cw - 1.4, h: 0.3, fontSize: 10, bold: true, charSpacing: 2, color: C.slate, valign: "middle" });
      // brand names stay in Latin script in both decks
      s.addText(mark, { x: mx(cx + 0.45, cw - 0.9), y: cy + 1.3, w: cw - 0.9, h: 0.9, fontFace: F.title, fontSize: 36, bold: true, charSpacing: 2, color: C.ink, margin: 0, align: al("left"), valign: "middle", isTextBox: true });
      if (parent) T(s, parent, { x: cx + 0.45, y: cy + 2.35, w: cw - 0.9, h: 1.0, fontSize: 14, color: C.body });
    });
    footer(s, n, false);
  }

  // ---------------- 15. TEAM ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.white };
    const t = T_.team;
    eyebrow(s, t.eyebrow, M, 0.6, 8);
    title(s, t.title, { x: M, y: 0.98, w: SW - 2 * M, h: 0.7, fontSize: 32 });
    // General Manager feature card
    const gx = M, gy = 1.95, gw = 3.6, gh = 4.95;
    R(s, pres.shapes.RECTANGLE, { x: gx, y: gy, w: gw, h: gh, fill: { color: C.ink }, line: { width: 0, color: C.ink } });
    IMG(s, "p_azzam.jpg", { x: gx, y: gy, w: gw, h: 3.0 });
    chip(s, gx + 0.3, gy + 3.25, 0.34, 0.14, C.cya);
    T(s, up(t.gm.role), { x: gx + 0.8, y: gy + 3.17, w: gw - 1.1, h: 0.3, fontSize: 10, bold: true, charSpacing: 2, color: C.cya, valign: "middle" });
    T(s, t.gm.name, { x: gx + 0.3, y: gy + 3.55, w: gw - 0.6, h: 0.45, fontSize: 20, bold: true, color: C.white, valign: "middle" });
    T(s, t.gm.line, { x: gx + 0.3, y: gy + 4.05, w: gw - 0.6, h: 0.8, fontSize: 12, color: "C3CBD6" });
    // Project managers 2x2
    const px = 4.5, pw = SW - px - M, cw = (pw - 0.25) / 2, ch = (gh - 0.25) / 2;
    t.pms.forEach(([name, disc, yrs, img], i) => {
      const cx = px + (i % 2) * (cw + 0.25), cy = gy + Math.floor(i / 2) * (ch + 0.25);
      const col = [C.mag, C.cya, C.yel, C.vio][i];
      R(s, pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: ch, fill: { color: C.soft }, line: { width: 0, color: C.soft } });
      IMG(s, img, { x: cx + 0.3, y: cy + 0.3, w: 1.75, h: 1.75 });
      const tx = cx + 2.25, tw = cw - 2.4;
      T(s, up(t.pmRole), { x: tx, y: cy + 0.3, w: tw, h: 0.25, fontSize: 8.5, bold: true, charSpacing: 1, color: TXT[col] });
      T(s, name, { x: tx, y: cy + 0.6, w: tw, h: 0.6, fontSize: 15, bold: true, color: C.ink, valign: "top" });
      T(s, disc, { x: tx, y: cy + 1.22, w: tw, h: 0.3, fontSize: 11, color: C.body });
      T(s, String(yrs), { x: tx, y: cy + 1.55, w: 0.5, h: 0.5, fontSize: 22, bold: true, color: C.ink, valign: "middle" });
      T(s, t.yearsWord(yrs), { x: tx + 0.52, y: cy + 1.55, w: tw - 0.52, h: 0.5, fontSize: 10, color: C.slate, valign: "middle" });
    });
    footer(s, n, false);
  }

  // ---------------- 16. CONTACT ----------------
  {
    const s = pres.addSlide(); n++;
    s.background = { color: C.ink };
    const c = T_.contact;
    IMG(s, "contact.jpg", { x: 0, y: 0, w: SW, h: SH });
    R(s, pres.shapes.RECTANGLE, { x: 0, y: 0, w: SW, h: SH, fill: { color: C.ink, transparency: 20 }, line: { width: 0, color: C.ink } });
    IMG(s, "logo_white.png", { x: M, y: 0.6, w: 2.5, h: 2.5 * (816 / 1264) });
    eyebrow(s, c.eyebrow, M, 2.55, 8, true);
    title(s, c.title, { x: M, y: 2.95, w: 11, h: 0.95, fontSize: 44 }, true);
    T(s, c.sub, { x: M, y: 3.95, w: 11.5, h: 0.4, fontSize: 15, color: "C3CBD6" });
    const cw = 4.1;
    const mail = await icon("MdMail", C.cya), phone = await icon("MdPhone", C.cya), web = await icon("MdLanguage", C.cya);
    c.people.forEach(([role, name, email, tel], i) => {
      const cx = M + i * (cw + 0.3), cy = 4.75;
      R(s, pres.shapes.RECTANGLE, { x: cx, y: cy, w: cw, h: 1.85, fill: { color: C.ink2, transparency: 10 }, line: { width: 0.75, color: "2A3547" } });
      T(s, up(role), { x: cx + 0.3, y: cy + 0.25, w: cw - 0.6, h: 0.25, fontSize: 10, bold: true, charSpacing: 2, color: C.cya });
      T(s, name, { x: cx + 0.3, y: cy + 0.5, w: cw - 0.6, h: 0.45, fontSize: 18, bold: true, color: C.white, valign: "middle" });
      IMG(s, mail, { x: cx + 0.3, y: cy + 1.07, w: 0.22, h: 0.22 });
      s.addText([{ text: email, options: { hyperlink: { url: `mailto:${email}` } } }], { x: mx(cx + 0.65, cw - 0.95), y: cy + 1.02, w: cw - 0.95, h: 0.32, fontFace: F.body, fontSize: 13, color: C.white, margin: 0, align: al("left"), valign: "middle", isTextBox: true });
      IMG(s, phone, { x: cx + 0.3, y: cy + 1.42, w: 0.22, h: 0.22 });
      const wa = { url: `https://wa.me/${tel.replace(/\D/g, "")}` };
      s.addText([
        { text: tel, options: { fontFace: F.body, fontSize: 13, color: C.white, hyperlink: { ...wa } } },
      ], { x: mx(cx + 0.65, cw - 0.95), y: cy + 1.37, w: cw - 0.95, h: 0.32, margin: 0, align: al("left"), valign: "middle", isTextBox: true, ...(RTL ? { rtlMode: true } : {}) });
    });
    const wx = M + 2 * (cw + 0.3), ww = SW - M - wx;
    R(s, pres.shapes.RECTANGLE, { x: wx, y: 4.75, w: ww, h: 1.85, fill: { color: C.mag }, line: { width: 0, color: C.mag } });
    T(s, up(c.webLabel), { x: wx + 0.3, y: 5.0, w: ww - 0.6, h: 0.25, fontSize: 10, bold: true, charSpacing: 2, color: C.white });
    IMG(s, await icon("MdLanguage", C.white), { x: wx + 0.3, y: 5.45, w: 0.36, h: 0.36 });
    s.addText([{ text: c.web, options: { hyperlink: { url: "https://www.nvi-sa.com" } } }], { x: mx(wx + 0.8, ww - 1.0), y: 5.4, w: ww - 1.0, h: 0.45, fontFace: F.sub, fontSize: 18, bold: true, color: C.white, margin: 0, align: al("left"), valign: "middle", isTextBox: true });
    footer(s, n, true);
  }

  const name = `NVIMC Company Profile - Bold (${LANG.toUpperCase()}).pptx`;
  await pres.writeFile({ fileName: path.join(OUT_DIR, name) });
  console.log("wrote", name, "slides:", n);
}

build().catch((e) => { console.error(e); process.exit(1); });
