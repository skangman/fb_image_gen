"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sarabun } from "next/font/google";

const DEFAULT_TEXT = "พิมพ์ข้อความตรงนี้…";
const DEFAULT_CAPTION = "แคปชั่นโพสต์ใหม่....";

const THAI_FONT_FALLBACK =
  '"Sarabun", "Noto Sans Thai", "Kanit", "Sukhumvit Set", "Prompt", "Maitree", "Pridi", system-ui, -apple-system, "Tahoma", "Arial", sans-serif';

const sarabun = Sarabun({
  weight: ["600", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
});

const FONT_CHOICES = [
  "Sarabun",
  "Kanit",
  "Pridi",
  "Athiti",
  "Prompt",
  "Maitree",
  "Bai Jamjuree",
  "Anuphan",
];

type RGB = { r: number; g: number; b: number };

type FontStyle = {
  size: number;
  lineHeight: number;
  paddingX: number;
  paddingY: number;
  fontWeight: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetY: number;
  fontFamily: string;
};

type ImageTone = {
  average: RGB;
  accent: RGB;
  isDark: boolean;
};

type PresetMode = "adaptive" | "gold" | "strike" | "banner";

const SARABUN_STACK =
  (sarabun.style.fontFamily &&
    `${sarabun.style.fontFamily}, ${THAI_FONT_FALLBACK}`) ||
  `"Sarabun", ${THAI_FONT_FALLBACK}`;

const clamp = (v: number, min = 0, max = 255) =>
  Math.min(max, Math.max(min, v));

const rgbToHex = ({ r, g, b }: RGB) => {
  const toHex = (n: number) =>
    clamp(Math.round(n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const adjustColor = (color: RGB, delta: number): RGB => ({
  r: clamp(color.r + delta),
  g: clamp(color.g + delta),
  b: clamp(color.b + delta),
});

const getLuminance = ({ r, g, b }: RGB) => 0.299 * r + 0.587 * g + 0.114 * b;

function analyzeImageColors(image: HTMLImageElement): ImageTone | null {
  const sampleSize = 64;
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, sampleSize, sampleSize);
  const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let maxScore = -1;
  let accent: RGB = { r: 255, g: 255, b: 255 };

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sumR += r;
    sumG += g;
    sumB += b;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const luminance = getLuminance({ r, g, b });
    const contrastToMid = Math.abs(luminance - 128) / 128;
    const score = saturation * 0.6 + contrastToMid * 0.4;

    if (score > maxScore) {
      maxScore = score;
      accent = { r, g, b };
    }
  }

  const pixels = data.length / 4;
  const average: RGB = {
    r: sumR / pixels,
    g: sumG / pixels,
    b: sumB / pixels,
  };

  return {
    average,
    accent,
    isDark: getLuminance(average) < 115,
  };
}

const buildFontStack = (primary?: string) =>
  primary ? `"${primary}", ${THAI_FONT_FALLBACK}` : THAI_FONT_FALLBACK;

const pickRandomFontStack = () => {
  const idx = Math.floor(Math.random() * FONT_CHOICES.length);
  return buildFontStack(FONT_CHOICES[idx]);
};

function deriveFontStyleFromImage(
  img: HTMLImageElement
): Partial<FontStyle> | null {
  const tone = analyzeImageColors(img);
  if (!tone) return null;

  const { average, accent, isDark } = tone;
  const fillBase = isDark
    ? adjustColor(average, 65)
    : adjustColor(average, -80);
  const strokeBase = isDark
    ? adjustColor(accent, -40)
    : adjustColor(accent, 50);
  const size = Math.round(50 + Math.random() * 10);
  const paddingY = 78 + Math.round(Math.random() * 18);

  return {
    fill: rgbToHex(fillBase),
    stroke: rgbToHex(strokeBase),
    shadowColor: isDark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.38)",
    strokeWidth: isDark ? 3.6 : 3.2,
    fontFamily: pickRandomFontStack(),
    lineHeight: 1.18 + Math.random() * 0.07,
    size,
    paddingY,
  };
}

export default function ImageComposer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const W = 960;
  const H = 1200;

  // ภาพที่นำเข้า (ไฟล์) / หรือ URL
  const [imageUrl, setImageUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("fb-post-960x1200.png");
  const [preset, setPreset] = useState<PresetMode>("adaptive");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSettings, setLogoSettings] = useState({
    size: 120,
    opacity: 0.35,
    blur: 1,
    padding: 40,
  });

  // ข้อความในภาพ
  const [text, setText] = useState(DEFAULT_TEXT);
  const [caption, setCaption] = useState(DEFAULT_CAPTION);
  const [copyMsg, setCopyMsg] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // สไตล์ตัวอักษร (คงโทนนักรบ/คม)
  const [fontStyle, setFontStyle] = useState<FontStyle>({
    size: 54,
    lineHeight: 1.22,
    paddingX: 80,
    paddingY: 90,
    fontWeight: 700,
    fill: "#F5F7FF",
    stroke: "#7A0D1B",
    strokeWidth: 3,
    shadowColor: "rgba(0,0,0,0.55)",
    shadowBlur: 14,
    shadowOffsetY: 6,
    fontFamily: SARABUN_STACK,
  });

  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ) {
    const lines: string[] = [];
    const paragraphs = text.replace(/\r/g, "").split("\n");

    paragraphs.forEach((paragraph, idx) => {
      // รองรับภาษาไทยที่ไม่มี space ด้วย (ตัดแบบหยาบ)
      // ถ้ามี space จะใช้แบบเดิม
      const hasSpace = paragraph.includes(" ");
      const tokens = hasSpace
        ? paragraph.split(" ").filter(Boolean)
        : paragraph.split("").filter(Boolean);

      let line = "";
      for (let i = 0; i < tokens.length; i++) {
        const piece = tokens[i];
        const testLine = line
          ? hasSpace
            ? `${line} ${piece}`
            : `${line}${piece}`
          : piece;
        const m = ctx.measureText(testLine);
        if (m.width > maxWidth && line) {
          lines.push(line);
          line = piece;
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line);

      if (idx < paragraphs.length - 1) lines.push("");
    });

    return lines;
  }

  async function loadImageSafe(src: string) {
    return new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  }

  function drawFallbackBackground(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#0c1224");
    gradient.addColorStop(1, "#05070f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  function drawBottomPlate(ctx: CanvasRenderingContext2D) {
    // แผ่นเงาด้านล่างช่วยให้ตัวหนังสืออ่านง่าย
    const bandH = 320;
    const band = ctx.createLinearGradient(0, H - bandH, 0, H);
    band.addColorStop(0, "rgba(0,0,0,0.00)");
    band.addColorStop(0.35, "rgba(0,0,0,0.25)");
    band.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = band;
    ctx.fillRect(0, H - bandH, W, bandH);
  }

  async function loadLogoSafe(src: string) {
    return new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  }

  function createCaptionFromText(raw: string) {
    const normalized = raw.replace(/\r/g, "").trim();
    if (!normalized) return DEFAULT_CAPTION;

    const rnd = () => Math.random();
    const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
    const shuffle = <T,>(arr: T[]) => [...arr].sort(() => rnd() - 0.5);

    const cleanOneLine = normalized.replace(/\s+/g, " ");
    const snippet =
      cleanOneLine.length > 180
        ? `${cleanOneLine.slice(0, 180).trim()}...`
        : cleanOneLine;

    const lines = normalized
      .split("\n")
      .map((ln) => ln.trim())
      .filter(Boolean);

    const sampleBulletCount = Math.min(3, Math.max(1, lines.length));
    const bullets = shuffle(lines)
      .slice(0, sampleBulletCount)
      .map((ln) => `• ${ln}`)
      .join("\n");

    const hookThemes = [
      "มุมมองใหม่",
      "บทเรียนสั้นๆ",
      "ทริกเล็กๆ แต่ทรงพลัง",
      "สรุปเข้าใจง่าย",
      "ไอเดียสร้างแรงบันดาลใจ",
      "ข้อคิดที่ใช้ได้จริง",
      "ประเด็นที่ไม่อยากให้พลาด",
      "สรุปมุมคิดแบบย่อยง่าย",
    ];
    const hookTemplates = [
      "✨ {theme} ที่อยากชวนอ่าน",
      "🔥 {theme} ต้องเล่าต่อ",
      "💡 {theme} อ่านแป๊บเดียว",
      "📌 {theme} เก็บไว้เป็นแรงบันดาลใจ",
      "⭐ {theme} สำหรับวันนี้",
      "🧭 {theme} สำหรับคนรีบอ่าน",
    ];
    const makeHook = () => {
      const template = pick(hookTemplates);
      const theme = pick(hookThemes);
      return template.replace("{theme}", theme);
    };

    const ctaActions = [
      "ถ้าอินเหมือนกัน กดเซฟ/แชร์ไว้เลย",
      "เม้นคุยกัน บทเรียนนี้ใช้ได้ทุกวัน",
      "ส่งต่อให้คนที่ควรเห็นโพสต์นี้",
      "ใครมีมุมมอง ลองเม้นต่อยอดกัน",
      "เก็บไว้ก่อนโพสต์ ลองหยิบไปใช้ดู",
      "แปะไว้ในสตอรี่ ชวนเพื่อนอ่าน",
    ];
    const ctaPrompts = [
      "อยากฟังประสบการณ์ของคุณ",
      "บอกหน่อยว่าเคยลองวิธีนี้ไหม",
      "แชร์ต่อช่วยกันขยายพลังดีๆ",
      "ใครชอบแนวนี้กดเซฟไว้",
      "เม้นสั้นๆ สิ่งที่ได้จากโพสต์นี้",
    ];
    const makeCta = () => `${pick(ctaActions)} | ${pick(ctaPrompts)}`;

    const tagsPool = [
      "#แชร์มุมคิด",
      "#แรงบันดาลใจ",
      "#เขียนให้อ่านง่าย",
      "#ชวนคุย",
      "#กำลังใจดีดี",
      "#บทเรียนชีวิต",
      "#สรุปสั้นๆ",
      "#มุมมองใหม่",
      "#คิดแล้วเล่า",
      "#เขียนสั้นอ่านง่าย",
      "#สายคอนเทนต์",
    ];

    const pickedTags = shuffle(tagsPool).slice(0, 3).join(" ");

    return [makeHook(), snippet, bullets, `👉 ${makeCta()}`, pickedTags]
      .filter(Boolean)
      .join("\n\n");
  }

  async function rewriteCaptionWithAI(raw: string) {
    const payload = { text: raw?.trim?.() || DEFAULT_TEXT };
    setAiLoading(true);
    setAiError("");
    try {
      const resp = await fetch("/api/rewrite-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.caption) {
        throw new Error(data?.error || "rewrite failed");
      }
      setCaption(data.caption);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "เรียก AI ไม่สำเร็จ";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  }

  async function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = W;
    canvas.height = H;

    // 1) วาดภาพพื้นหลังจากไฟล์/URL (ถ้าไม่มี ให้ fallback)
    const img = imageUrl ? await loadImageSafe(imageUrl) : null;

    if (img) {
      // cover ให้เต็ม 960x1200
      const imgAR = img.width / img.height;
      const canvasAR = W / H;

      let sx = 0,
        sy = 0,
        sw = img.width,
        sh = img.height;

      if (imgAR > canvasAR) {
        sh = img.height;
        sw = Math.floor(sh * canvasAR);
        sx = Math.floor((img.width - sw) / 2);
      } else {
        sw = img.width;
        sh = Math.floor(sw / canvasAR);
        sy = Math.floor((img.height - sh) / 2);
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    } else {
      drawFallbackBackground(ctx);
    }

    // 2) ทำแผ่นเงาด้านล่างเพื่ออ่านง่าย
    drawBottomPlate(ctx);

    // 2.5) วางโลโก้แบบเบลอ
    if (logoUrl) {
      const logoImg = await loadLogoSafe(logoUrl);
      if (logoImg) {
        const targetW = logoSettings.size;
        const aspect = logoImg.width / logoImg.height || 1;
        const targetH = targetW / aspect;
        const x = W - targetW - logoSettings.padding;
        const y = logoSettings.padding;
        ctx.save();
        ctx.globalAlpha = logoSettings.opacity;
        // ใช้ filter blur ให้โลโก้ดูซอฟต์
        ctx.filter = `blur(${logoSettings.blur}px)`;
        ctx.drawImage(logoImg, x, y, targetW, targetH);
        ctx.restore();
      }
    }

    // 3) วาดข้อความไทย
    const safeText = (text || "").trim();
    if (!safeText) return;

    const maxTextWidth = W - fontStyle.paddingX * 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // auto ลดขนาดฟอนต์ถ้าล้น
    let drawFontSize = fontStyle.size;
    let lines: string[] = [];

    while (drawFontSize >= 34) {
      ctx.font = `${fontStyle.fontWeight} ${drawFontSize}px ${fontStyle.fontFamily}`;
      const candidate = wrapText(ctx, safeText, maxTextWidth);
      const longest = candidate.reduce(
        (acc, ln) => Math.max(acc, ctx.measureText(ln).width),
        0
      );
      lines = candidate;
      if (longest <= maxTextWidth) break;
      drawFontSize -= 2;
    }

    const totalTextHeight = lines.length * drawFontSize * fontStyle.lineHeight;
    const startY = H - fontStyle.paddingY - totalTextHeight / 2;

    ctx.font = `${fontStyle.fontWeight} ${drawFontSize}px ${fontStyle.fontFamily}`;

    const isGold = preset === "gold";
    const isStrike = preset === "strike";
    const isBanner = preset === "banner";
    const shadowColor = isGold
      ? "rgba(0,0,0,0.48)"
      : isStrike
      ? "rgba(0,0,0,0.8)"
      : isBanner
      ? "rgba(0,0,0,0.75)"
      : fontStyle.shadowColor;
    const strokeWidth = isGold
      ? Math.max(drawFontSize * 0.08, 4.8)
      : isStrike
      ? Math.max(drawFontSize * 0.06, 4.5)
      : isBanner
      ? Math.max(drawFontSize * 0.05, 4.2)
      : fontStyle.strokeWidth;
    const strokeColor = isGold
      ? "#3b2500"
      : isStrike
      ? "#0c0f1a"
      : isBanner
      ? "#0a0a0a"
      : fontStyle.stroke;

    // เงา
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = isGold
      ? 18
      : isStrike
      ? 22
      : isBanner
      ? 20
      : fontStyle.shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = isGold
      ? 8
      : isStrike
      ? 10
      : isBanner
      ? 12
      : fontStyle.shadowOffsetY;

    // stroke
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;

    lines.forEach((ln, idx) => {
      const y = startY + idx * drawFontSize * fontStyle.lineHeight;
      ctx.strokeText(ln, W / 2, y);
    });

    // fill
    if (isGold) {
      const grad = ctx.createLinearGradient(
        W / 2,
        startY - drawFontSize,
        W / 2,
        startY + totalTextHeight + drawFontSize
      );
      grad.addColorStop(0, "#f4e4b2");
      grad.addColorStop(0.45, "#f6d57a");
      grad.addColorStop(0.55, "#d6a73a");
      grad.addColorStop(1, "#9a6b1b");
      ctx.fillStyle = grad;
    } else if (isStrike) {
      const grad = ctx.createLinearGradient(
        0,
        startY - drawFontSize,
        0,
        startY + totalTextHeight + drawFontSize
      );
      grad.addColorStop(0, "#f7f8fc");
      grad.addColorStop(0.35, "#e6e8f1");
      grad.addColorStop(0.65, "#d32f2f");
      grad.addColorStop(1, "#8c0f0f");
      ctx.fillStyle = grad;
    } else if (isBanner) {
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.45, "#ffffff");
      grad.addColorStop(0.55, "#f2c23a");
      grad.addColorStop(1, "#f2c23a");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = fontStyle.fill;
    }
    lines.forEach((ln, idx) => {
      const y = startY + idx * drawFontSize * fontStyle.lineHeight;
      ctx.fillText(ln, W / 2, y);
    });

    // reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  function downloadPNG() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "fb-post-960x1200.png";
    a.click();
  }

  function onPickFile(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // ตั้งชื่อไฟล์ output ให้ตามไฟล์ต้นทาง
    const base = file.name.replace(/\.[^.]+$/, "");
    setFileName(`${base}-960x1200.png`);
  }

  function onPickLogo(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
  }

  useEffect(() => {
    let cancelled = false;

    const adaptStyle = async () => {
      if (!imageUrl || preset !== "adaptive") return;
      const img = await loadImageSafe(imageUrl);
      if (!img || cancelled) return;
      const adaptive = deriveFontStyleFromImage(img);
      if (!adaptive) return;
      setFontStyle((prev) => ({
        ...prev,
        ...adaptive,
        fontFamily: prev.fontFamily,
        fontWeight: prev.fontWeight,
      }));
    };

    adaptStyle().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [imageUrl, preset]);

  useEffect(() => {
    const run = async () => {
      if (document?.fonts?.ready) await document.fonts.ready;
      await draw();
    };
    run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, text, fontStyle, preset, logoUrl, logoSettings]);

  return (
    <div className={`${sarabun.className} grid gap-6 lg:grid-cols-[420px_1fr]`}>
      {/* LEFT: Controls */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
        <div className="space-y-5">
          {/* Upload */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="mb-2 text-sm font-semibold text-white">
              นำภาพเข้า
            </div>

            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:opacity-90"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            />

            <div className="mt-3 grid gap-2">
              <label className="text-xs text-white/60">
                หรือใส่ลิงก์รูป (optional)
              </label>
              <input
                value={imageUrl.startsWith("blob:") ? "" : imageUrl}
                onChange={(e) => setImageUrl(e.target.value.trim())}
                placeholder="https://.../image.jpg"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              />
              <p className="text-xs text-white/50">
                แนะนำใช้ Upload ไฟล์จะชัวร์สุด (ไม่ติด CORS)
              </p>
            </div>
          </div>

          {/* Logo */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="mb-2 text-sm font-semibold text-white">
              โลโก้ (เบลอ)
            </div>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-white/80 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:opacity-90"
              onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
            />
            <div className="mt-3 grid gap-2">
              <label className="text-xs text-white/60">
                หรือใส่ลิงก์โลโก้ (optional)
              </label>
              <input
                value={logoUrl.startsWith("blob:") ? "" : logoUrl}
                onChange={(e) => setLogoUrl(e.target.value.trim())}
                placeholder="https://.../logo.png"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div className="mt-3 grid gap-2 text-xs text-white/70">
              <label>
                ขนาดโลโก้: {Math.round(logoSettings.size)} px
                <input
                  type="range"
                  min={60}
                  max={220}
                  step={2}
                  value={logoSettings.size}
                  onChange={(e) =>
                    setLogoSettings((prev) => ({
                      ...prev,
                      size: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full accent-emerald-400"
                />
              </label>
              <label>
                Blur: {logoSettings.blur}px
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={logoSettings.blur}
                  onChange={(e) =>
                    setLogoSettings((prev) => ({
                      ...prev,
                      blur: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full accent-emerald-400"
                />
              </label>
              <label>
                Opacity: {Math.round(logoSettings.opacity * 100)}%
                <input
                  type="range"
                  min={5}
                  max={80}
                  step={1}
                  value={logoSettings.opacity * 100}
                  onChange={(e) =>
                    setLogoSettings((prev) => ({
                      ...prev,
                      opacity: Number(e.target.value) / 100,
                    }))
                  }
                  className="mt-1 w-full accent-emerald-400"
                />
              </label>
              <label>
                ระยะจากขอบล่าง: {logoSettings.padding}px
                <input
                  type="range"
                  min={10}
                  max={160}
                  step={2}
                  value={logoSettings.padding}
                  onChange={(e) =>
                    setLogoSettings((prev) => ({
                      ...prev,
                      padding: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full accent-emerald-400"
                />
              </label>
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="mb-2 block text-sm text-white/80">
              ข้อความในภาพ (ตรวจคำแล้ว)
            </label>
            <textarea
              className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="พิมพ์ข้อความไทยที่ต้องการให้ขึ้นในภาพ..."
            />

            <div className="mt-2 flex gap-2">
              <button
                className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                onClick={() => setText(DEFAULT_TEXT)}
              >
                รีเซ็ตข้อความ
              </button>
            </div>
          </div>

          {/* Preset & size */}
          <div className="grid gap-3 rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="text-sm font-semibold text-white">
              สไตล์ตัวหนังสือ
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "adaptive", label: "สุ่มตามพื้นหลัง" },
                { key: "gold", label: "ทอง-เหลือง" },
                { key: "strike", label: "ขาว-แดง" },
                { key: "banner", label: "แบนเนอร์ดำ-เหลือง" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setPreset(opt.key as PresetMode)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    preset === opt.key
                      ? "bg-emerald-500 text-black"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { weight: 700, label: "Sarabun Bold" },
                { weight: 600, label: "Sarabun SemiBold" },
              ].map((opt) => (
                <button
                  key={opt.weight}
                  onClick={() =>
                    setFontStyle((prev) => ({
                      ...prev,
                      fontFamily: SARABUN_STACK,
                      fontWeight: opt.weight,
                    }))
                  }
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    fontStyle.fontWeight === opt.weight &&
                    fontStyle.fontFamily.includes("Sarabun")
                      ? "bg-white text-black"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label className="text-xs text-white/60">
              ขนาดตัวอักษรพื้นฐาน (จะปรับลงอัตโนมัติถ้าบรรทัดยาว)
            </label>
            <input
              type="range"
              min={34}
              max={120}
              step={1}
              value={fontStyle.size}
              onChange={(e) =>
                setFontStyle((prev) => ({
                  ...prev,
                  size: Number(e.target.value),
                  strokeWidth: Math.max(3, Number(e.target.value) * 0.06),
                }))
              }
              className="w-full accent-emerald-400"
            />
            <div className="text-xs text-white/60">
              ตอนนี้: {Math.round(fontStyle.size)} px
            </div>

            <label className="mt-2 text-xs text-white/60">
              ตำแหน่งแนวตั้ง (เพิ่ม = ขึ้นสูง)
            </label>
            <input
              type="range"
              min={60}
              max={280}
              step={2}
              value={fontStyle.paddingY}
              onChange={(e) =>
                setFontStyle((prev) => ({
                  ...prev,
                  paddingY: Number(e.target.value),
                }))
              }
              className="w-full accent-emerald-400"
            />
            <div className="text-xs text-white/60">
              ระยะจากขอบล่าง: {Math.round(fontStyle.paddingY)} px
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
              onClick={() => draw()}
            >
              Render ใหม่
            </button>

            <button
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={downloadPNG}
              disabled={!text.trim()}
            >
              Download PNG (960×1200)
            </button>
          </div>

          <div className="text-xs text-white/50">
            หมายเหตุ: ถ้าอยากได้ตำแหน่ง/ขนาดตัวอักษรแบบอื่น บอกผมได้
            เดี๋ยวปรับให้
          </div>
        </div>
      </div>

      {/* RIGHT: Preview */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-3">
          <div className="text-sm text-white/70">Preview</div>
          <div className="text-xs text-white/50">Canvas: 960×1200</div>
        </div>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="h-auto w-full max-w-[480px] rounded-2xl border border-white/10 bg-black"
          />
        </div>
      </div>
    </div>
  );
}
