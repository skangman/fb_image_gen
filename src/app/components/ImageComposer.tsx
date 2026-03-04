"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Kanit,
  Maitree,
  Sarabun,
} from "next/font/google";

const DEFAULT_TEXT = "";
const DEFAULT_CAPTION = "แคปชั่นโพสต์ใหม่....";

const THAI_FONT_FALLBACK =
  '"Sarabun", "Noto Sans Thai", "Kanit", "Sukhumvit Set", "Prompt", "Maitree", "Pridi", system-ui, -apple-system, "Tahoma", "Arial", sans-serif';

const sarabun = Sarabun({
  weight: ["600", "700", "800"],
  subsets: ["latin", "thai"],
  display: "swap",
});

const kanit = Kanit({
  weight: ["600", "700", "800"],
  subsets: ["latin", "thai"],
  display: "swap",
});

const maitree = Maitree({
  weight: ["600", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
});

const buildStackFromFont = (
  font: { style?: { fontFamily?: string } },
  fallbackName: string
) =>
  font?.style?.fontFamily
    ? `${font.style.fontFamily}, ${THAI_FONT_FALLBACK}`
    : `"${fallbackName}", ${THAI_FONT_FALLBACK}`;

const SARABUN_STACK = buildStackFromFont(sarabun, "Sarabun");
const KANIT_STACK = buildStackFromFont(kanit, "Kanit");
const MAITREE_STACK = buildStackFromFont(maitree, "Maitree");

const FONT_OPTIONS = [
  {
    key: "sarabun",
    label: "Sarabun",
    stack: SARABUN_STACK,
    className: sarabun.className,
  },
  {
    key: "kanit",
    label: "Kanit",
    stack: KANIT_STACK,
    className: kanit.className,
  },
  {
    key: "maitree",
    label: "Maitree",
    stack: MAITREE_STACK,
    className: maitree.className,
  },
];

const FONT_STACK_CHOICES = FONT_OPTIONS.map((opt) => opt.stack);

const FONT_WEIGHT_OPTIONS = [
  { weight: 800, label: "Extra Bold" },
  { weight: 700, label: "Bold" },
  { weight: 600, label: "SemiBold" },
];

const INITIAL_LOGO_SETTINGS = {
  size: 120,
  opacity: 0.35,
  blur: 1,
  padding: 40,
};

const createInitialFontStyle = (): FontStyle => ({
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

type PresetMode =
  | "adaptive"
  | "custom"
  | "gold"
  | "silver"
  | "strike"
  | "banner"
  | "mono";
type SectionKey = "canvas" | "media" | "text" | "style";
type CanvasPreset = "960x1200" | "1:1";
type TextColorPreset = {
  key: string;
  label: string;
  swatch: string;
  preset?: PresetMode;
  fill?: string;
  stroke?: string;
  shadowColor?: string;
  strokeWidth?: number;
};

const CANVAS_OPTIONS: Array<{
  key: CanvasPreset;
  label: string;
  width: number;
  height: number;
}> = [
  { key: "960x1200", label: "960×1200", width: 960, height: 1200 },
  { key: "1:1", label: "1:1 (960×960)", width: 960, height: 960 },
];

const DEFAULT_CANVAS_PRESET: CanvasPreset = "960x1200";
const DEFAULT_STYLE_COLORS = {
  fill: "#F5F7FF",
  stroke: "#7A0D1B",
  shadowColor: "rgba(0,0,0,0.55)",
  strokeWidth: 3,
};

const TEXT_COLOR_PRESETS: TextColorPreset[] = [
  {
    key: "default",
    label: "Default",
    swatch: "linear-gradient(135deg, #f5f7ff 0%, #c7d2fe 100%)",
    fill: DEFAULT_STYLE_COLORS.fill,
    stroke: DEFAULT_STYLE_COLORS.stroke,
    shadowColor: DEFAULT_STYLE_COLORS.shadowColor,
    strokeWidth: DEFAULT_STYLE_COLORS.strokeWidth,
  },
  {
    key: "gold",
    label: "Gold",
    swatch: "linear-gradient(135deg, #f6d57a 0%, #a7741e 100%)",
    preset: "gold",
  },
  {
    key: "ice",
    label: "Ice",
    swatch: "linear-gradient(135deg, #ffffff 0%, #b5d8ff 100%)",
    fill: "#F2F8FF",
    stroke: "#245A8A",
    shadowColor: "rgba(5,22,45,0.6)",
    strokeWidth: 3.4,
  },
  {
    key: "mint",
    label: "Mint",
    swatch: "linear-gradient(135deg, #d7ffe8 0%, #3dbb7a 100%)",
    fill: "#E8FFF1",
    stroke: "#0E6A44",
    shadowColor: "rgba(0,0,0,0.55)",
    strokeWidth: 3.4,
  },
  {
    key: "sunset",
    label: "Sunset",
    swatch: "linear-gradient(135deg, #ffe0bf 0%, #ff7f50 100%)",
    fill: "#FFE9D0",
    stroke: "#A14A1A",
    shadowColor: "rgba(0,0,0,0.6)",
    strokeWidth: 3.4,
  },
  {
    key: "rose",
    label: "Rose",
    swatch: "linear-gradient(135deg, #ffe5ea 0%, #db6f86 100%)",
    fill: "#FFEFF3",
    stroke: "#8A1F3C",
    shadowColor: "rgba(0,0,0,0.58)",
    strokeWidth: 3.4,
  },
];

const getCanvasDimensions = (preset: CanvasPreset) =>
  CANVAS_OPTIONS.find((opt) => opt.key === preset) ?? CANVAS_OPTIONS[0];

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

const pickRandomFontStack = () => {
  const idx = Math.floor(Math.random() * FONT_STACK_CHOICES.length);
  return FONT_STACK_CHOICES[idx] || SARABUN_STACK;
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

  // ภาพที่นำเข้า (ไฟล์) / หรือ URL
  const [imageUrl, setImageUrl] = useState<string>("");
  const [canvasPreset, setCanvasPreset] = useState<CanvasPreset>(
    DEFAULT_CANVAS_PRESET
  );
  const [outputBaseName, setOutputBaseName] = useState<string>("fb-post");
  const [pickedImageName, setPickedImageName] = useState<string>("");
  const [preset, setPreset] = useState<PresetMode>("adaptive");
  const [logoUrl, setLogoUrl] = useState("");
  const [pickedLogoName, setPickedLogoName] = useState<string>("");
  const [logoSettings, setLogoSettings] = useState(INITIAL_LOGO_SETTINGS);
  const [logoPosition, setLogoPosition] = useState<"bottom-left" | "bottom-right">("bottom-right");
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    canvas: false,
    media: false,
    text: false,
    style: false,
  });

  // ข้อความในภาพ
  const [text, setText] = useState(DEFAULT_TEXT);
  const [caption, setCaption] = useState(DEFAULT_CAPTION);
  const [copyMsg, setCopyMsg] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // สไตล์ตัวอักษร (คงโทนนักรบ/คม)
  const [fontStyle, setFontStyle] = useState<FontStyle>(() =>
    createInitialFontStyle()
  );
  const { width: W, height: H } = getCanvasDimensions(canvasPreset);
  const fileName = `${outputBaseName}-${W}x${H}.png`;

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
    band.addColorStop(0.4, "rgba(0,0,0,0.12)");
    band.addColorStop(1, "rgba(0,0,0,0.42)");
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
        const x =
          logoPosition === "bottom-right"
            ? W - targetW - logoSettings.padding
            : logoSettings.padding;
        const y = H - targetH - logoSettings.padding;
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

    const lineHeights = lines.map(
      (ln) => (ln.trim() ? 1 : 0.55) * drawFontSize * fontStyle.lineHeight
    );
    const totalTextHeight = lineHeights.reduce((sum, h) => sum + h, 0);
    const rawStartY = H - fontStyle.paddingY - totalTextHeight / 2;
    const minStart = drawFontSize * 0.75;
    const maxStart = Math.max(
      minStart,
      H - totalTextHeight - drawFontSize * 0.4
    );
    const startY = Math.min(Math.max(rawStartY, minStart), maxStart);

    ctx.font = `${fontStyle.fontWeight} ${drawFontSize}px ${fontStyle.fontFamily}`;

    const isGold = preset === "gold";
    const isSilver = preset === "silver";
    const isStrike = preset === "strike";
    const isBanner = preset === "banner";
    const isMono = preset === "mono";
    const shadowColor = isGold
      ? "rgba(0,0,0,0.48)"
      : isSilver
      ? "rgba(0,0,0,0.72)"
      : isStrike
      ? "rgba(0,0,0,0.8)"
      : isBanner
      ? "rgba(0,0,0,0.75)"
      : isMono
      ? "rgba(0,0,0,0.75)"
      : fontStyle.shadowColor;
    const strokeWidth = isGold
      ? Math.max(drawFontSize * 0.08, 4.8)
      : isSilver
      ? Math.max(drawFontSize * 0.07, 4.6)
      : isStrike
      ? Math.max(drawFontSize * 0.06, 4.5)
      : isBanner
      ? Math.max(drawFontSize * 0.05, 4.2)
      : isMono
      ? Math.max(drawFontSize * 0.06, 4.5)
      : fontStyle.strokeWidth;
    const strokeColor = isGold
      ? "#3b2500"
      : isSilver
      ? "#3a3f4a"
      : isStrike
      ? "#0c0f1a"
      : isBanner
      ? "#0a0a0a"
      : isMono
      ? "#000000"
      : fontStyle.stroke;

    // เงา
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = isGold
      ? 18
      : isSilver
      ? 24
      : isStrike
      ? 22
      : isBanner
      ? 20
      : isMono
      ? 18
      : fontStyle.shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = isGold
      ? 8
      : isSilver
      ? 11
      : isStrike
      ? 10
      : isBanner
      ? 12
      : isMono
      ? 10
      : fontStyle.shadowOffsetY;

    // stroke
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;

    let yCursor = startY;
    lines.forEach((ln, idx) => {
      ctx.strokeText(ln, W / 2, yCursor);
      yCursor += lineHeights[idx];
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
    } else if (isSilver) {
      const grad = ctx.createLinearGradient(
        W / 2,
        startY - drawFontSize,
        W / 2,
        startY + totalTextHeight + drawFontSize
      );
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.2, "#f1f4fa");
      grad.addColorStop(0.45, "#d6dce6");
      grad.addColorStop(0.7, "#e4e8ef");
      grad.addColorStop(1, "#9099aa");
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
    } else if (isMono) {
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = fontStyle.fill;
    }
    yCursor = startY;
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, W / 2, yCursor);
      yCursor += lineHeights[idx];
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
    a.download = fileName;
    a.click();
  }

  function onPickFile(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setPickedImageName(file.name);

    // ตั้งชื่อไฟล์ output ให้ตามไฟล์ต้นทาง
    const base = file.name.replace(/\.[^.]+$/, "");
    setOutputBaseName(base);
  }

  function onPickLogo(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
    setPickedLogoName(file.name);
  }

  function resetAll() {
    setImageUrl("");
    setCanvasPreset(DEFAULT_CANVAS_PRESET);
    setOutputBaseName("fb-post");
    setPickedImageName("");
    setPreset("adaptive");
    setLogoUrl("");
    setPickedLogoName("");
    setLogoSettings({ ...INITIAL_LOGO_SETTINGS });
    setText(DEFAULT_TEXT);
    setCaption(DEFAULT_CAPTION);
    setCopyMsg("");
    setAiError("");
    setAiLoading(false);
    setFontStyle(createInitialFontStyle());
    setOpenSections({
      canvas: false,
      media: false,
      text: false,
      style: false,
    });
  }

  function toggleSection(section: SectionKey) {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function setAllSections(isOpen: boolean) {
    setOpenSections({
      canvas: isOpen,
      media: isOpen,
      text: isOpen,
      style: isOpen,
    });
  }

  function applyTextColorPreset(presetOpt: TextColorPreset) {
    if (presetOpt.preset) {
      setPreset(presetOpt.preset);
      return;
    }

    setPreset("custom");
    setFontStyle((prev) => ({
      ...prev,
      fill: presetOpt.fill ?? prev.fill,
      stroke: presetOpt.stroke ?? prev.stroke,
      shadowColor: presetOpt.shadowColor ?? prev.shadowColor,
      strokeWidth: presetOpt.strokeWidth ?? prev.strokeWidth,
    }));
  }

  function isTextColorPresetActive(presetOpt: TextColorPreset) {
    if (presetOpt.preset) return preset === presetOpt.preset;
    return (
      preset === "custom" &&
      presetOpt.fill === fontStyle.fill &&
      presetOpt.stroke === fontStyle.stroke
    );
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
  }, [imageUrl, text, fontStyle, preset, logoUrl, logoSettings, canvasPreset]);

  return (
    <div
      className={`${sarabun.className} grid h-[calc(100vh-1rem)] items-start gap-2 overflow-hidden sm:grid-cols-[420px_minmax(0,1fr)] xl:grid-cols-[480px_minmax(0,1fr)]`}
    >
      {/* LEFT: Controls */}
      <div className="min-h-0 h-full overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-2.5 shadow-sm">
        <div className="space-y-2">
          {/* Actions */}
          <div className="flex flex-wrap gap-1.5">
            <button
              className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
              onClick={resetAll}
            >
              Reset All
            </button>

            <button
              className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={downloadPNG}
            >
              Download PNG ({W}×{H})
            </button>
            <button
              className="rounded-xl bg-white/10 px-2.5 py-1.5 text-xs text-white hover:bg-white/15"
              onClick={() => setAllSections(false)}
            >
              Collapse All
            </button>
            <button
              className="rounded-xl bg-white/10 px-2.5 py-1.5 text-xs text-white hover:bg-white/15"
              onClick={() => setAllSections(true)}
            >
              Expand All
            </button>
          </div>

          {/* Canvas Size */}
          <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
            <button
              type="button"
              onClick={() => toggleSection("canvas")}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-white">Canvas Size</span>
              <span className="text-xs text-white/60">
                {openSections.canvas ? "Collapse" : "Expand"}
              </span>
            </button>
            {openSections.canvas && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {CANVAS_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setCanvasPreset(opt.key)}
                    className={`rounded-xl px-2 py-1.5 text-sm font-semibold ${
                      canvasPreset === opt.key
                        ? "bg-white text-black"
                        : "bg-white/10 text-white hover:bg-white/15"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Upload + Logo */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
            <button
              type="button"
              onClick={() => toggleSection("media")}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-white">
                นำภาพเข้า + โลโก้ (เบลอ)
              </span>
              <span className="text-xs text-white/60">
                {openSections.media ? "Collapse" : "Expand"}
              </span>
            </button>
            {openSections.media && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs font-semibold text-white/80">
                    ภาพหลัก
                  </div>
                  <input
                    id="main-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="main-image-upload"
                      className="cursor-pointer rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                    >
                      Choose file
                    </label>
                    <span className="min-w-0 flex-1 truncate text-xs text-white/60">
                      {pickedImageName || "ยังไม่ได้เลือกไฟล์"}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold text-white/80">
                    โลโก้
                  </div>
                  <input
                    id="logo-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="logo-image-upload"
                      className="cursor-pointer rounded-lg bg-white/80 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                    >
                      Choose file
                    </label>
                    <span className="min-w-0 flex-1 truncate text-xs text-white/60">
                      {pickedLogoName || "ยังไม่ได้เลือกไฟล์"}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 mt-1 grid grid-cols-2 gap-2 text-xs text-white/70">
                  <label className="flex flex-col gap-1">
                    <span>ตำแหน่ง</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "bottom-right", label: "ขวาล่าง" },
                        { key: "bottom-left", label: "ซ้ายล่าง" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() =>
                            setLogoPosition(
                              opt.key as "bottom-left" | "bottom-right"
                            )
                          }
                          className={`rounded-lg px-3 py-2 font-semibold ${
                            logoPosition === opt.key
                              ? "bg-white text-black"
                              : "bg-white/10 text-white hover:bg-white/15"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>ขนาดโลโก้: {Math.round(logoSettings.size)} px</span>
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
                      className="w-full accent-emerald-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Blur: {logoSettings.blur}px</span>
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
                      className="w-full accent-emerald-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Opacity: {Math.round(logoSettings.opacity * 100)}%</span>
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
                      className="w-full accent-emerald-400"
                    />
                  </label>
                  <label className="col-span-2 flex flex-col gap-1">
                    <span>ระยะจากขอบล่าง/ซ้าย: {logoSettings.padding}px</span>
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
                      className="w-full accent-emerald-400"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Text */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
            <button
              type="button"
              onClick={() => toggleSection("text")}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-white">
                ข้อความในภาพ (ตรวจคำแล้ว)
              </span>
              <span className="text-xs text-white/60">
                {openSections.text ? "Collapse" : "Expand"}
              </span>
            </button>
            {openSections.text && (
              <div className="mt-2">
                <textarea
                  className="min-h-[84px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="พิมพ์ข้อความไทยที่ต้องการให้ขึ้นในภาพ..."
                />

                <div className="mt-1.5 flex gap-2">
                  <button
                    className="rounded-xl bg-white/10 px-2.5 py-1.5 text-xs text-white hover:bg-white/15"
                    onClick={() => setText(DEFAULT_TEXT)}
                  >
                    รีเซ็ตข้อความ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preset & size */}
          <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
            <button
              type="button"
              onClick={() => toggleSection("style")}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-white">
                สไตล์ตัวหนังสือ
              </span>
              <span className="text-xs text-white/60">
                {openSections.style ? "Collapse" : "Expand"}
              </span>
            </button>
            {openSections.style && (
              <div className="mt-2 grid gap-1.5">
                <div className="grid gap-2">
                  <div className="text-xs text-white/60">
                    โทนสีตัวหนังสือ (จิ้มเลือก)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {TEXT_COLOR_PRESETS.map((opt) => (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => applyTextColorPreset(opt)}
                        className={`rounded-xl border px-2 py-1.5 text-xs font-semibold ${
                          isTextColorPresetActive(opt)
                            ? "border-emerald-400 bg-white/15 text-white"
                            : "border-white/10 bg-white/10 text-white hover:bg-white/15"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white/30"
                            style={{ background: opt.swatch }}
                          />
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-xs text-white/60">ฟอนต์</div>
                  <div className="grid grid-cols-3 gap-2">
                    {FONT_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() =>
                          setFontStyle((prev) => ({
                            ...prev,
                            fontFamily: opt.stack,
                          }))
                        }
                        className={`${
                          opt.className
                        } rounded-xl px-2 py-1 text-sm font-semibold ${
                          fontStyle.fontFamily === opt.stack
                            ? "bg-white text-black"
                            : "bg-white/10 text-white hover:bg-white/15"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {FONT_WEIGHT_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.weight}
                      onClick={() =>
                        setFontStyle((prev) => ({
                          ...prev,
                          fontWeight: opt.weight,
                        }))
                      }
                      className={`rounded-xl px-2 py-1 text-sm font-semibold ${
                        fontStyle.fontWeight === opt.weight
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
                  min={0}
                  max={1100}
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
                  ปรับค่า 0 (ล่าง) ถึง 1100 (บน):{" "}
                  {Math.round(fontStyle.paddingY)} px
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* RIGHT: Preview */}
      <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:flex sm:flex-col">
        <div className="mb-2">
          <div className="text-sm text-white/70">Preview</div>
          <div className="text-xs text-white/50">Canvas: {W}×{H}</div>
        </div>

        <div className="flex justify-center sm:flex-1 sm:items-start">
          <canvas
            ref={canvasRef}
            className="h-auto max-h-[calc(100vh-6.5rem)] w-full max-w-[400px] rounded-2xl border border-white/10 bg-black lg:max-w-[440px]"
          />
        </div>
      </div>
    </div>
  );
}
