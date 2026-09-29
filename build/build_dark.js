// NVIMC company profile generator — DARK theme (sleek / futuristic).
// Same layout, content, fonts and crops as the Minimal theme (build.js); dark
// glow-and-grid pages, faded photo panels, HUD corner marks, cyan accents and a
// logo-spectrum tick on each section header.
//
//   node build/build_dark.js en   -> NVIMC Company Profile - Dark (EN).pptx
//   node build/build_dark.js ar   -> NVIMC Company Profile - Dark (AR).pptx  (mirrored, right-to-left)
// Run build/prep_images.py, then build/prep_dark.py, to populate build/assets_dark/.

const path = require("path");
const pptxgen = require("pptxgenjs");

const LANG = process.argv[2] || "en";
const RTL = LANG === "ar";
const T_ = require("./content")[LANG];
const OUT_DIR = path.join(__dirname, "..");
const A = (p) => path.join(__dirname, "assets_dark", p);

const SW = 13.333, SH = 7.5, M = 0.6, W = SW - 2 * M;
// Content column beside the right-hand photo panel.
const PANEL_X = 8.733, PANEL_W = SW - PANEL_X, CW = PANEL_X - 0.6 - M;

// Typography (portfolio deck). None of these carry Arabic, so the Arabic deck
// sets Arabic runs in Segoe UI, which ships with Windows and Office.
const F = { title: "Cinzel", sub: "Bahnschrift", body: "Century Gothic", mono: "Consolas", ar: "Segoe UI" };
const C = {
  bg: "0B0D12", title: "F2F4F8", body: "AAB3C0", muted: "7F8999", rule: "283040",
  accent: "3CC8EE", // luminous cyan from the logo; numerals, labels and links
  spectrum: ["FBBA16", "E5177B", "2DB8E0", "5B54A4"], // logo stripes
};
const AR_RE = /[؀-ۿ]/;

// ---------- mirroring helpers (Arabic deck flips horizontally) ----------
const mx = (x, w) => (RTL ? SW - x - w : x);
const al = (a) => (!RTL ? a : a === "left" ? "right" : a === "right" ? "left" : a);
const up = (t) => (RTL ? t : t.toUpperCase());
const pad = (n) => String(n).padStart(2, "0");

function runOpts(o, text) {
  const r = { ...o };
  if (RTL) {
    r.rtlMode = true;
    r.lang = "ar-SA";
    if (AR_RE.test(text)) {
      r.fontFace = F.ar;
      delete r.charSpacing;
      // Arabic glyphs read smaller than Latin at the same size; lift small labels.
      if (r.fontSize && r.fontSize <= 12) r.fontSize = Math.round(r.fontSize * 1.15 * 10) / 10;
    }
  }
  return r;
}
function T(s, text, o) {
  const plain = Array.isArray(text) ? text.map((r) => r.text).join("") : text;
  const opt = runOpts({ fontFace: F.body, color: C.body, margin: 0, valign: "top", isTextBox: true, ...o }, plain);
  opt.x = mx(o.x, o.w);
  opt.align = al(o.align || "left");
  if (Array.isArray(text)) {
    text = text.map((r) => {
      const ro = runOpts({ ...(r.options || {}) }, r.text);
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
  s.addImage({ path: A(src), ...o, x: mx(o.x, o.w) });
}

// ---------- recurring pieces ----------
let pres;
function rule(s, x, y, w, color = C.rule) {
  R(s, pres.shapes.LINE, { x, y, w, h: 0, line: { color, width: 0.75 } });
}
// Section header: mono number, Cinzel title, full-width hairline beneath.
function head(s, num, title, x = M, w = W) {
  T(s, num, { x, y: 0.5, w: 0.8, h: 0.45, fontFace: F.mono, fontSize: 11, color: C.muted, valign: "middle" });
  T(s, up(title), { x: x + 0.85, y: 0.42, w: w - 0.85, h: 0.6, fontFace: F.title, fontSize: 25, color: C.title, charSpacing: 1, valign: "middle" });
  rule(s, x, 1.12, w);
  C.spectrum.forEach((col, i) => R(s, pres.shapes.RECTANGLE, { x: x + i * 0.22, y: 1.1, w: 0.2, h: 0.045, fill: { color: col }, line: { color: col, width: 0 } }));
}
// Page: glow-and-grid background (mirrored for the Arabic deck).
function bg(s) {
  s.background = { color: C.bg };
  s.addImage({ path: A(RTL ? "bg_r.jpg" : "bg.jpg"), x: 0, y: 0, w: SW, h: SH });
}
// Full-height photo panels fade into the page on their inner edge.
const panel = (name) => name.replace(".jpg", RTL ? "_r.png" : ".png");
// HUD-style corner marks around a photo.
function hud(s, x, y, w, h, len = 0.22) {
  const ln = { color: C.accent, width: 1 };
  const px = mx(x, w);
  [[px, y, 1, 1], [px + w, y, -1, 1], [px, y + h, 1, -1], [px + w, y + h, -1, -1]].forEach(([cx, cy, dx, dy]) => {
    s.addShape(pres.shapes.LINE, { x: dx > 0 ? cx - 0.08 : cx - len + 0.08, y: cy - (dy > 0 ? 0.08 : -0.08), w: len, h: 0, line: { ...ln } });
    s.addShape(pres.shapes.LINE, { x: cx - (dx > 0 ? 0.08 : -0.08), y: dy > 0 ? cy - 0.08 : cy - len + 0.08, w: 0, h: len, line: { ...ln } });
  });
}
function footer(s, n, x = M, w = W) {
  T(s, up(T_.footer), { x, y: 7.05, w: w - 0.6, h: 0.25, fontFace: F.mono, fontSize: 7.5, charSpacing: 3, color: C.muted, valign: "middle" });
  T(s, pad(n), { x: x + w - 0.6, y: 7.05, w: 0.6, h: 0.25, fontFace: F.mono, fontSize: 8, color: C.muted, align: "right", valign: "middle" });
}
function label(s, text, o) {
  T(s, up(text), { fontFace: F.mono, fontSize: 9.5, charSpacing: 2, color: C.accent, valign: "middle", ...o });
}
function numbered(s, items, x, y, w, rowH, size = 13.5, start = 1) {
  items.forEach((it, i) => {
    const cy = y + i * rowH;
    T(s, pad(start + i), { x, y: cy, w: 0.5, h: rowH - 0.1, fontFace: F.mono, fontSize: 10.5, color: C.accent, valign: "middle" });
    T(s, it, { x: x + 0.6, y: cy, w: w - 0.6, h: rowH - 0.1, fontFace: F.sub, fontSize: size, color: C.title, valign: "middle" });
    rule(s, x, cy + rowH - 0.05, w);
  });
}
const sectionName = (eyebrow) => eyebrow.split("·").pop().trim();
const SERVICE_KEYS = ["eng", "str", "fit", "ele", "low", "mec", "plu", "mnt"];
function serviceSlide(i, img) {
  const s = pres.addSlide();
  bg(s);
  IMG(s, panel(img), { x: PANEL_X, y: 0, w: PANEL_W, h: SH });
  head(s, `04.${i + 1}`, T_.services.names[i], M, CW);
  T(s, T_[SERVICE_KEYS[i]].intro, { x: M, y: 1.35, w: CW, h: 0.7, fontSize: 13, color: C.body });
  return s;
}

// ======================================================================
function build() {
  pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  // pptxgenjs does not escape & in docProps
  pres.author = "New Vision Integral for Maintenance and Contracting";
  pres.company = "New Vision Integral for Maintenance and Contracting";
  pres.title = RTL ? "ملف الشركة" : "Company Profile";
  if (RTL) pres.rtlMode = true;
  let n = 0;
  const web = () => ({ url: "https://www.nvi-sa.com" }); // fresh object per use: pptxgenjs mutates it

  // ---------------- 1. COVER ----------------
  {
    const s = pres.addSlide(); n++;
    bg(s);
    const c = T_.cover;
    IMG(s, "linework.png", { x: 0, y: 0, w: SW, h: SH });
    IMG(s, panel("cover.jpg"), { x: 7.0, y: 0, w: SW - 7.0, h: SH });
    IMG(s, "logo_white.png", { x: M, y: 0.6, w: 2.6, h: 2.6 * (816 / 1264) });
    label(s, c.eyebrow, { x: M, y: 2.75, w: 5.8, h: 0.3, color: C.muted, charSpacing: 4, fontSize: 10 });
    T(s, up(c.headline.replace("\n", " ")), { x: M, y: 3.1, w: 5.9, h: 1.6, fontFace: RTL ? F.ar : F.title, fontSize: 38, color: C.title, charSpacing: 1, valign: "top" });
    T(s, `${c.name} ${c.legal}`, { x: M, y: 4.8, w: 5.9, h: 0.4, fontFace: F.sub, fontSize: 15, color: C.title });
    T(s, c.lines, { x: M, y: 5.2, w: 5.9, h: 0.35, fontSize: 10.5, color: C.muted });
    T(s, c.location, { x: M, y: 6.45, w: 5.9, h: 0.25, fontSize: 10, color: C.body });
    T(s, [{ text: c.web, options: { hyperlink: web() } }], { x: M, y: 6.72, w: 5.9, h: 0.25, fontSize: 10, color: C.accent });
  }

  // ---------------- 2. WHO WE ARE ----------------
  {
    const s = pres.addSlide(); n++;
    bg(s);
    const a = T_.about;
    head(s, "01", sectionName(a.eyebrow));
    const sw = W / 4;
    a.stats.forEach(([num, lab], i) => {
      const cx = M + i * sw;
      T(s, num, { x: cx, y: 1.45, w: sw, h: 0.7, fontFace: F.mono, fontSize: 32, color: C.title, align: "center", valign: "middle" });
      T(s, lab, { x: cx, y: 2.15, w: sw, h: 0.35, fontSize: 10, color: C.muted, align: "center", valign: "middle" });
    });
    rule(s, M, 2.8, W);
    T(s, a.title, { x: M, y: 3.2, w: 6.1, h: 0.9, fontFace: F.sub, fontSize: 18, color: C.title });
    T(s, a.body, { x: M, y: 4.2, w: 6.1, h: 2.6, fontSize: 12, color: C.body, lineSpacingMultiple: 1.2 });
    IMG(s, "about.jpg", { x: SW - M - 5.53, y: 3.25, w: 5.53, h: 3.6 });
    hud(s, SW - M - 5.53, 3.25, 5.53, 3.6);
    footer(s, n);
  }

  // ---------------- 3. VISION, MISSION & VALUES ----------------
  {
    const s = pres.addSlide(); n++;
    bg(s);
    const p = T_.purpose;
    IMG(s, panel("vision.jpg"), { x: PANEL_X, y: 0, w: PANEL_W, h: SH });
    head(s, "02", p.title, M, CW);
    const lx = M, lw = 1.9, tx = M + 2.1, tw = CW - 2.1;
    const rows = [[p.visionLabel, 1.5, 1.35], [p.missionLabel, 3.15, 0.95]];
    rows.forEach(([lab, y, h], i) => {
      T(s, lab, { x: lx, y, w: lw, h: 0.35, fontFace: F.sub, fontSize: 14, bold: true, color: C.title });
      T(s, i === 0 ? p.vision : p.mission, { x: tx, y, w: tw, h, fontSize: 12.5, color: C.body, lineSpacingMultiple: 1.2 });
      rule(s, M, y + h + 0.12, CW);
    });
    T(s, p.valuesLabel, { x: lx, y: 4.45, w: lw, h: 0.35, fontFace: F.sub, fontSize: 14, bold: true, color: C.title });
    p.values.forEach((v, i) => {
      const cy = 4.45 + i * 0.55;
      T(s, pad(i + 1), { x: tx, y: cy, w: 0.5, h: 0.35, fontFace: F.mono, fontSize: 10.5, color: C.accent, valign: "middle" });
      T(s, v, { x: tx + 0.6, y: cy, w: tw - 0.6, h: 0.35, fontSize: 12.5, color: C.body, valign: "middle" });
    });
    footer(s, n, M, CW);
  }

  // ---------------- 4. OUR APPROACH ----------------
  {
    const s = pres.addSlide(); n++;
    bg(s);
    const a = T_.approach;
    head(s, "03", sectionName(a.eyebrow));
    IMG(s, "logo_mark.png", { x: SW - M - 2.5, y: 1.5, w: 2.5, h: 2.5 * (536 / 969) });
    T(s, a.title, { x: M, y: 1.5, w: 8.4, h: 0.5, fontFace: F.sub, fontSize: 20, color: C.title });
    T(s, a.sub, { x: M, y: 2.1, w: 8.4, h: 1.2, fontSize: 12.5, color: C.body, lineSpacingMultiple: 1.2 });
    const cw = (W - 3 * 0.4) / 4;
    a.pillars.forEach(([h, d], i) => {
      const cx = M + i * (cw + 0.4);
      rule(s, cx, 3.85, cw);
      T(s, pad(i + 1), { x: cx, y: 4.05, w: cw, h: 0.3, fontFace: F.mono, fontSize: 11, color: C.accent });
      T(s, h, { x: cx, y: 4.45, w: cw, h: 0.85, fontFace: F.sub, fontSize: 15, bold: true, color: C.title });
      T(s, d, { x: cx, y: 5.2, w: cw, h: 1.0, fontSize: 11, color: C.body, lineSpacingMultiple: 1.15 });
    });
    footer(s, n);
  }

  // ---------------- 5. WHAT WE DO ----------------
  {
    const s = pres.addSlide(); n++;
    bg(s);
    const sv = T_.services;
    head(s, "04", sectionName(sv.eyebrow));
    T(s, sv.title, { x: M, y: 1.3, w: W, h: 0.4, fontSize: 12.5, color: C.body, valign: "middle" });
    const tiles = ["t_eng", "t_str", "t_fit", "t_ele", "t_low", "t_mec", "t_plu", "t_mnt"];
    const tw = (W - 3 * 0.3) / 4, ih = 1.75;
    tiles.forEach((t, i) => {
      const cx = M + (i % 4) * (tw + 0.3), cy = 1.95 + Math.floor(i / 4) * 2.55;
      IMG(s, t + ".jpg", { x: cx, y: cy, w: tw, h: ih });
      T(s, `04.${i + 1}`, { x: cx, y: cy + ih + 0.12, w: 0.6, h: 0.3, fontFace: F.mono, fontSize: 10, color: C.accent, valign: "middle" });
      T(s, sv.names[i], { x: cx + 0.65, y: cy + ih + 0.12, w: tw - 0.65, h: 0.55, fontFace: F.sub, fontSize: 13, bold: true, color: C.title, valign: "top" });
    });
    footer(s, n);
  }

  // ---------------- 6. 04.1 ENGINEERING & PLANNING ----------------
  {
    const s = serviceSlide(0, "s_eng.jpg"); n++;
    const e = T_.eng;
    const cw = (CW - 0.4) / 2;
    e.phases.forEach(([ph, items], i) => {
      const cx = M + (i % 2) * (cw + 0.4), cy = 2.2 + Math.floor(i / 2) * 2.35;
      rule(s, cx, cy, cw);
      label(s, `${e.phaseLabel} ${pad(i + 1)}`, { x: cx, y: cy + 0.15, w: cw, h: 0.28 });
      T(s, ph, { x: cx, y: cy + 0.45, w: cw, h: 0.38, fontFace: F.sub, fontSize: 14, bold: true, color: C.title, valign: "middle" });
      T(s, items.map((it, k) => ({ text: it, options: { bullet: { indent: 10 }, breakLine: k < items.length - 1, paraSpaceAfter: 3 } })), {
        x: cx, y: cy + 0.92, w: cw, h: 1.3, fontSize: RTL ? 9.5 : 10.5, color: C.body,
      });
    });
    footer(s, n, M, CW);
  }

  // ---------------- 7. 04.2 CONTRACTING & STRUCTURE ----------------
  {
    const s = serviceSlide(1, "s_str.jpg"); n++;
    const st = T_.str;
    const lw = 3.6;
    numbered(s, st.items, M, 2.25, lw, 0.85, 20);
    rule(s, M, 4.35, lw);
    T(s, "35", { x: M, y: 4.55, w: lw, h: 0.95, fontFace: F.mono, fontSize: 48, color: C.title, valign: "middle" });
    T(s, st.statLabel, { x: M, y: 5.55, w: lw, h: 0.6, fontSize: 11, color: C.body });
    IMG(s, "str_b.jpg", { x: M + CW - 3.615, y: 2.25, w: 3.615, h: 4.55 });
    hud(s, M + CW - 3.615, 2.25, 3.615, 4.55);
    footer(s, n, M, CW);
  }

  // ---------------- 8. 04.3 FIT-OUT & FINISHING ----------------
  {
    const s = serviceSlide(2, "s_fit.jpg"); n++;
    const f = T_.fit;
    const cw = (CW - 0.4) / 2;
    [f.items.slice(0, 4), f.items.slice(4)].forEach((col, c) =>
      numbered(s, col, M + c * (cw + 0.4), 2.2, cw, 0.58, 12.5, c * 4 + 1));
    IMG(s, "fit_b.jpg", { x: M, y: 4.75, w: cw, h: 2.1 });
    hud(s, M, 4.75, cw, 2.1);
    IMG(s, "fit_c.jpg", { x: M + cw + 0.4, y: 4.75, w: cw, h: 2.1 });
    hud(s, M + cw + 0.4, 4.75, cw, 2.1);
    footer(s, n, M, CW);
  }

  // ---------------- 9. 04.4 ELECTRICAL ----------------
  {
    const s = serviceSlide(3, "s_ele.jpg"); n++;
    numbered(s, T_.ele.items, M, 2.2, CW, 0.64, 15);
    footer(s, n, M, CW);
  }

  // ---------------- 10. 04.5 LOW CURRENT ----------------
  {
    const s = serviceSlide(4, "s_low.jpg"); n++;
    const l = T_.low;
    const cw = (CW - 0.4) / 2;
    numbered(s, l.items.slice(0, 6), M, 2.2, cw, 0.72, 12);
    numbered(s, l.items.slice(6), M + cw + 0.4, 2.2, cw, 0.72, 12, 7);
    const sy = 2.2 + 5 * 0.72, sx = M + cw + 0.4;
    T(s, "11", { x: sx, y: sy, w: 0.55, h: 0.62, fontFace: F.mono, fontSize: 28, color: C.accent, valign: "middle" });
    T(s, l.calloutLabel, { x: sx + 0.6, y: sy, w: cw - 0.6, h: 0.62, fontSize: 10.5, color: C.body, valign: "middle" });
    footer(s, n, M, CW);
  }

  // ---------------- 11. 04.6 MECHANICAL & HVAC ----------------
  {
    const s = serviceSlide(5, "s_mec.jpg"); n++;
    numbered(s, T_.mec.items, M, 2.25, CW, 1.05, 18);
    footer(s, n, M, CW);
  }

  // ---------------- 12. 04.7 PLUMBING & FIRE FIGHTING ----------------
  {
    const s = serviceSlide(6, "s_plu.jpg"); n++;
    const cw = (CW - 0.4) / 2;
    let start = 1;
    T_.plu.groups.forEach(([name, items], g) => {
      const gx = M + g * (cw + 0.4);
      label(s, name, { x: gx, y: 2.2, w: cw, h: 0.35 });
      rule(s, gx, 2.62, cw);
      numbered(s, items, gx, 2.72, cw, 0.72, 12.5, start);
      start += items.length;
    });
    footer(s, n, M, CW);
  }

  // ---------------- 13. 04.8 FACILITY MAINTENANCE ----------------
  {
    const s = serviceSlide(7, "s_mnt.jpg"); n++;
    const m = T_.mnt;
    const cw = (CW - 0.4) / 2;
    numbered(s, m.items.slice(0, 4), M, 2.2, cw, 0.9, 13);
    numbered(s, m.items.slice(4), M + cw + 0.4, 2.2, cw, 0.9, 13, 5);
    footer(s, n, M, CW);
  }

  // ---------------- 14. CLIENTS ----------------
  {
    const s = pres.addSlide(); n++;
    bg(s);
    const c = T_.clients;
    head(s, "05", c.title);
    T(s, c.sub, { x: M, y: 1.3, w: W, h: 0.4, fontSize: 12.5, color: C.body, valign: "middle" });
    const cw = (W - 2 * 0.4) / 3;
    c.list.forEach(([mark, parent], i) => {
      const cx = M + i * (cw + 0.4);
      rule(s, cx, 2.0, cw);
      label(s, `${c.label} ${pad(i + 1)}`, { x: cx, y: 2.15, w: cw, h: 0.3 });
      // brand names stay in Latin script in both decks
      s.addText(mark, { x: mx(cx, cw), y: 2.5, w: cw, h: 0.65, fontFace: F.title, fontSize: 30, color: C.title, charSpacing: 2, margin: 0, align: al("left"), valign: "middle", isTextBox: true });
      T(s, parent, { x: cx, y: 3.25, w: cw, h: 0.6, fontSize: 12, color: C.body });
    });
    IMG(s, "clients.jpg", { x: M, y: 4.25, w: W, h: 2.6 });
    hud(s, M, 4.25, W, 2.6);
    footer(s, n);
  }

  // ---------------- 15. LEADERSHIP ----------------
  {
    const s = pres.addSlide(); n++;
    bg(s);
    const t = T_.team;
    head(s, "06", sectionName(t.eyebrow));
    // General Manager
    const gw = 3.2;
    IMG(s, "p_azzam.jpg", { x: M, y: 1.45, w: gw, h: 3.9 });
    hud(s, M, 1.45, gw, 3.9);
    label(s, t.gm.role, { x: M, y: 5.5, w: gw, h: 0.28 });
    T(s, t.gm.name, { x: M, y: 5.8, w: gw, h: 0.4, fontFace: F.sub, fontSize: 17, bold: true, color: C.title, valign: "middle" });
    T(s, t.gm.line, { x: M, y: 6.22, w: gw, h: 0.65, fontSize: 10, color: C.body });
    // Project managers
    const px = M + gw + 0.5, pw = SW - M - px, cw = (pw - 3 * 0.3) / 4, ph = cw * (2.3 / 1.9);
    t.pms.forEach(([name, disc, yrs, img], i) => {
      const cx = px + i * (cw + 0.3);
      IMG(s, img, { x: cx, y: 1.45, w: cw, h: ph });
      const ty = 1.45 + ph + 0.15;
      label(s, t.pmRole, { x: cx, y: ty, w: cw, h: 0.28 });
      T(s, name, { x: cx, y: ty + 0.3, w: cw, h: 0.55, fontFace: F.sub, fontSize: 13.5, bold: true, color: C.title, valign: "top" });
      T(s, disc, { x: cx, y: ty + 0.88, w: cw, h: 0.3, fontSize: 10.5, color: C.body });
      rule(s, cx, ty + 1.3, cw);
      T(s, String(yrs), { x: cx, y: ty + 1.4, w: 0.55, h: 0.5, fontFace: F.mono, fontSize: 22, color: C.title, valign: "middle" });
      T(s, t.yearsWord(yrs), { x: cx + 0.6, y: ty + 1.4, w: cw - 0.6, h: 0.5, fontSize: 9.5, color: C.muted, valign: "middle" });
    });
    footer(s, n);
  }

  // ---------------- 16. CONTACT ----------------
  {
    const s = pres.addSlide(); n++;
    bg(s);
    const c = T_.contact, cv = T_.cover;
    IMG(s, "linework.png", { x: 0, y: 0, w: SW, h: SH });
    const lw = 2.7;
    IMG(s, "logo_white.png", { x: (SW - lw) / 2, y: 0.55, w: lw, h: lw * (816 / 1264) });
    // The logo already carries the English name; the Arabic deck adds the Arabic name.
    if (RTL) T(s, cv.name, { x: M, y: 2.45, w: W, h: 0.5, fontSize: 24, color: C.title, align: "center", valign: "middle" });
    T(s, RTL ? cv.legal : `${cv.name} ${cv.legal}`, { x: M, y: RTL ? 2.95 : 2.6, w: W, h: 0.4, fontFace: F.sub, fontSize: 15, color: C.body, align: "center", valign: "middle" });
    const cw = 3.9, gap = 0.6, x0 = (SW - 2 * cw - gap) / 2;
    c.people.forEach(([role, name, email, tel], i) => {
      const cx = x0 + i * (cw + gap);
      rule(s, cx, 3.75, cw);
      label(s, role, { x: cx, y: 3.9, w: cw, h: 0.28, align: "center" });
      T(s, name, { x: cx, y: 4.22, w: cw, h: 0.4, fontFace: F.sub, fontSize: 16, bold: true, color: C.title, align: "center", valign: "middle" });
      s.addText([{ text: email, options: { hyperlink: { url: `mailto:${email}` } } }], {
        x: mx(cx, cw), y: 4.7, w: cw, h: 0.3, fontFace: F.body, fontSize: 11.5, color: C.accent, margin: 0, align: "center", valign: "middle", isTextBox: true,
      });
      const wa = `https://wa.me/${tel.replace(/\D/g, "")}`;
      s.addText([
        { text: tel, options: { fontFace: F.body, fontSize: 11.5, color: C.accent, hyperlink: { url: wa } } },
      ], { x: mx(cx, cw), y: 5.02, w: cw, h: 0.3, margin: 0, align: "center", valign: "middle", isTextBox: true, ...(RTL ? { rtlMode: true } : {}) });
    });
    rule(s, x0, 5.65, 2 * cw + gap);
    s.addText([{ text: c.web, options: { hyperlink: web() } }], { x: M, y: 5.85, w: W, h: 0.35, fontFace: F.sub, fontSize: 14, color: C.accent, margin: 0, align: "center", valign: "middle", isTextBox: true });
    T(s, cv.location, { x: M, y: 6.25, w: W, h: 0.3, fontSize: 10, color: C.muted, align: "center", valign: "middle" });
    footer(s, n);
  }

  const name = `NVIMC Company Profile - Dark (${LANG.toUpperCase()}).pptx`;
  return pres.writeFile({ fileName: path.join(OUT_DIR, name) }).then(() => console.log("wrote", name, "slides:", n));
}

build().catch((e) => { console.error(e); process.exit(1); });
