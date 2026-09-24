import { createElement } from "react";
import type { jsPDF as JsPDF } from "jspdf";
import { hospitalName, type DigitalCardData } from "./data";
import type { DigitalCardTheme } from "./themes";

/**
 * The PDF is a vector trace of the exact same <DigitalDoctorCard> used in the
 * workspace preview: the card is rendered off-screen, then every box, border,
 * text line, icon and image is redrawn with jsPDF at its measured position.
 * Text stays real text and every link/button becomes a real link annotation.
 */

const CARD_WIDTH = 400; // CSS px — same as the preview's max width
const MARGIN = 10; // CSS px of white page around the rounded card
const PAGE_WIDTH_PT = 298; // ≈ 105 mm

type RGBA = { r: number; g: number; b: number; a: number };

const probe = (() => {
  let ctx: CanvasRenderingContext2D | null = null;
  return () => {
    if (!ctx) {
      const c = document.createElement("canvas");
      c.width = c.height = 1;
      ctx = c.getContext("2d", { willReadFrequently: true })!;
    }
    return ctx;
  };
})();

function parseColor(value: string | null | undefined): RGBA | null {
  if (!value || value === "transparent" || value === "none") return null;
  const ctx = probe();
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  if (!a) return null;
  return { r: r!, g: g!, b: b!, a: a! / 255 };
}

function splitTopLevel(value: string) {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Solid (unblurred) box-shadows — how Tailwind renders rings around the photo. */
function solidShadows(value: string) {
  if (!value || value === "none") return [];
  return splitTopLevel(value)
    .map((s) => {
      if (s.includes("inset")) return null;
      const m = s.match(/^((?:[a-z-]+\([^)]*\))|#[0-9a-f]+|[a-z]+)\s+(.*)$/i);
      if (!m) return null;
      const nums = m[2]!.split(/\s+/).map((n) => parseFloat(n));
      const [ox = 0, oy = 0, blur = 0, spread = 0] = nums;
      if (ox || oy || blur || spread <= 0) return null;
      const color = parseColor(m[1]);
      return color ? { color, spread } : null;
    })
    .filter(Boolean) as { color: RGBA; spread: number }[];
}

async function loadBitmap(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Image unavailable");
  return createImageBitmap(await res.blob());
}

function waitFrame() {
  return new Promise<void>((r) => requestAnimationFrame(() => r()));
}

export async function downloadDigitalCardPdf(card: DigitalCardData, themeKey: DigitalCardTheme) {
  const [{ jsPDF }, { createRoot }, { flushSync }, { DigitalDoctorCard }] = await Promise.all([
    import("jspdf"),
    import("react-dom/client"),
    import("react-dom"),
    import("@/components/digital-card/digital-doctor-card"),
  ]);

  // 1. Render the real preview card off-screen at its design width.
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${CARD_WIDTH}px;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(DigitalDoctorCard, { card, theme: themeKey })));
    await Promise.all(
      Array.from(host.querySelectorAll("img")).map((img) => img.decode().catch(() => undefined)),
    );
    await document.fonts?.ready;
    await waitFrame();
    await waitFrame();

    const article = host.querySelector("article") as HTMLElement;
    const origin = article.getBoundingClientRect();
    const s = PAGE_WIDTH_PT / (origin.width + MARGIN * 2);
    const pageH = (origin.height + MARGIN * 2) * s;

    const doc = new jsPDF({ unit: "pt", format: [PAGE_WIDTH_PT, pageH], orientation: "portrait", compress: true });
    doc.setProperties({ title: `${card.name} — Digital Card`, author: hospitalName, subject: "Digital Doctor Card" });
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, PAGE_WIDTH_PT, pageH, "F");

    const X = (px: number) => (px - origin.left + MARGIN) * s;
    const Y = (px: number) => (px - origin.top + MARGIN) * s;

    const renderer = new Renderer(doc, s, X, Y);
    await renderer.walk(article, 1, true);

    doc.save(`${card.slug || "doctor"}-digital-card.pdf`);
  } finally {
    root.unmount();
    host.remove();
  }
}

class Renderer {
  constructor(
    private doc: JsPDF,
    private s: number,
    private X: (px: number) => number,
    private Y: (px: number) => number,
  ) {}

  private alpha(a: number, fn: () => void) {
    const doc = this.doc as JsPDF & { GState: new (o: object) => unknown; setGState: (g: unknown) => void };
    if (a >= 0.999) return fn();
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: a, "stroke-opacity": a }));
    fn();
    doc.restoreGraphicsState();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number, style: "F" | "S" | "FD" | null) {
    const rr = Math.min(r, w / 2, h / 2);
    if (rr > 0.2) this.doc.roundedRect(x, y, w, h, rr, rr, style);
    else this.doc.rect(x, y, w, h, style);
  }

  async walk(el: Element, parentOpacity: number, isRoot = false): Promise<void> {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const opacity = parentOpacity * parseFloat(cs.opacity || "1");
    const rect = el.getBoundingClientRect();
    const { doc, s } = this;
    const x = this.X(rect.left);
    const y = this.Y(rect.top);
    const w = rect.width * s;
    const h = rect.height * s;
    const radius = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, rect.width / 2, rect.height / 2) * s;

    if (w > 0 && h > 0) {
      // Rings (solid box-shadows), outermost first.
      const rings = solidShadows(cs.boxShadow).sort((a, b) => b.spread - a.spread);
      for (const ring of rings) {
        const sp = ring.spread * s;
        doc.setFillColor(ring.color.r, ring.color.g, ring.color.b);
        this.alpha(ring.color.a * opacity, () => this.roundRect(x - sp, y - sp, w + sp * 2, h + sp * 2, radius + sp, "F"));
      }

      // Background (supports clip-path polygons for angled headers).
      const bg = parseColor(cs.backgroundColor);
      if (bg) {
        doc.setFillColor(bg.r, bg.g, bg.b);
        const poly = cs.clipPath && cs.clipPath.startsWith("polygon(") ? this.polygon(cs.clipPath, x, y, w, h) : null;
        this.alpha(bg.a * opacity, () => {
          if (poly) {
            const [first, ...rest] = poly;
            const segs = rest.map((p, i) => [p[0] - (i === 0 ? first![0] : rest[i - 1]![0]), p[1] - (i === 0 ? first![1] : rest[i - 1]![1])]);
            doc.lines(segs, first![0], first![1], [1, 1], "F", true);
          } else this.roundRect(x, y, w, h, radius, "F");
        });
      }

      this.borders(cs, x, y, w, h, radius, opacity);
    }

    // Round the whole card: clip everything inside it to its outline.
    if (isRoot) {
      doc.saveGraphicsState();
      this.roundRect(x, y, w, h, radius, null);
      (doc as unknown as { clip: () => void; discardPath: () => void }).clip();
      (doc as unknown as { discardPath: () => void }).discardPath();
    }

    if (el instanceof HTMLImageElement) {
      await this.image(el, cs, x, y, w, h, radius, opacity);
    } else if (el instanceof SVGSVGElement) {
      await this.svg(el, cs, x, y, w, h, opacity);
    } else {
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) this.text(child as Text, el as HTMLElement, cs, opacity);
        else if (child instanceof Element) await this.walk(child, opacity);
      }
    }

    // Real link annotations for every link and button.
    const href = el.getAttribute("data-pdf-href") ?? (el instanceof HTMLAnchorElement ? el.href : null);
    if (href && w > 0 && h > 0) doc.link(x, y, w, h, { url: new URL(href, window.location.origin).toString() });

    if (isRoot) doc.restoreGraphicsState();
  }

  private polygon(value: string, x: number, y: number, w: number, h: number) {
    const inner = value.slice(value.indexOf("(") + 1, value.lastIndexOf(")"));
    const v = (tok: string, size: number) => (tok.endsWith("%") ? (parseFloat(tok) / 100) * size : parseFloat(tok) * this.s);
    return inner.split(",").map((pair) => {
      const [a = "0", b = "0"] = pair.trim().split(/\s+/);
      return [x + v(a, w), y + v(b, h)] as [number, number];
    });
  }

  private borders(cs: CSSStyleDeclaration, x: number, y: number, w: number, h: number, radius: number, opacity: number) {
    const { doc, s } = this;
    const sides = (["Top", "Right", "Bottom", "Left"] as const).map((side) => ({
      side,
      width: cs.getPropertyValue(`border-${side.toLowerCase()}-style`) === "none" ? 0 : parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`)) || 0,
      color: parseColor(cs.getPropertyValue(`border-${side.toLowerCase()}-color`)),
    }));
    const uniform = sides.every((b) => b.width === sides[0]!.width && b.color && sides[0]!.color && b.color.r === sides[0]!.color.r && b.color.g === sides[0]!.color.g && b.color.b === sides[0]!.color.b && b.color.a === sides[0]!.color.a);
    if (uniform && sides[0]!.width > 0 && sides[0]!.color) {
      const bw = sides[0]!.width * s;
      const c = sides[0]!.color;
      doc.setDrawColor(c.r, c.g, c.b);
      doc.setLineWidth(bw);
      this.alpha(c.a * opacity, () => this.roundRect(x + bw / 2, y + bw / 2, w - bw, h - bw, Math.max(0, radius - bw / 2), "S"));
      return;
    }
    for (const b of sides) {
      if (!b.width || !b.color) continue;
      const bw = b.width * s;
      doc.setFillColor(b.color.r, b.color.g, b.color.b);
      this.alpha(b.color.a * opacity, () => {
        if (b.side === "Top") doc.rect(x, y, w, bw, "F");
        if (b.side === "Bottom") doc.rect(x, y + h - bw, w, bw, "F");
        if (b.side === "Left") doc.rect(x, y, bw, h, "F");
        if (b.side === "Right") doc.rect(x + w - bw, y, bw, h, "F");
      });
    }
  }

  private text(node: Text, parent: HTMLElement, cs: CSSStyleDeclaration, opacity: number) {
    const raw = node.textContent ?? "";
    if (!raw.trim()) return;
    const color = parseColor(cs.color);
    if (!color) return;
    const { doc, s } = this;

    // Group words into the visual lines the browser actually laid out.
    const lines: { words: string[]; left: number; right: number; top: number; bottom: number }[] = [];
    const range = document.createRange();
    for (const m of raw.matchAll(/\S+/g)) {
      range.setStart(node, m.index!);
      range.setEnd(node, m.index! + m[0].length);
      const r = range.getClientRects()[0];
      if (!r || !r.width) continue;
      const line = lines.find((l) => Math.abs(l.top - r.top) < 2);
      if (line) {
        line.words.push(m[0]);
        line.left = Math.min(line.left, r.left);
        line.right = Math.max(line.right, r.right);
        line.bottom = Math.max(line.bottom, r.bottom);
      } else lines.push({ words: [m[0]], left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    }

    const bold = parseInt(cs.fontWeight, 10) >= 600;
    const upper = cs.textTransform === "uppercase";
    const baseSize = parseFloat(cs.fontSize) * s;
    const spacing = (parseFloat(cs.letterSpacing) || 0) * s;
    const parentDisplay = parent.parentElement ? getComputedStyle(parent).display : "";
    const centered = cs.textAlign === "center" || /flex|grid/.test(parentDisplay) && parent.childNodes.length > 1;

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(color.r, color.g, color.b);
    for (const line of lines) {
      let str = line.words.join(" ");
      if (upper) str = str.toUpperCase();
      const target = (line.right - line.left) * s;
      let size = baseSize;
      doc.setFontSize(size);
      doc.setCharSpace(spacing);
      const measured = doc.getTextWidth(str) + spacing * Math.max(0, str.length - 1);
      if (measured > target * 1.02 && measured > 0) {
        size = baseSize * ((target * 1.02) / measured);
        doc.setFontSize(size);
      }
      const midY = this.Y((line.top + line.bottom) / 2);
      const align = centered || cs.textAlign === "center";
      const tx = align ? this.X((line.left + line.right) / 2) : this.X(line.left);
      this.alpha(color.a * opacity, () =>
        doc.text(str, tx, midY, { align: align ? "center" : "left", baseline: "middle" }),
      );
    }
    doc.setCharSpace(0);
  }

  private async image(img: HTMLImageElement, cs: CSSStyleDeclaration, x: number, y: number, w: number, h: number, radius: number, opacity: number) {
    const src = img.currentSrc || img.src;
    if (!src) return;
    const bmp = await loadBitmap(src).catch(() => null);
    if (!bmp) return;
    const scale = 4;
    const cw = Math.max(1, Math.round((w / this.s) * scale));
    const ch = Math.max(1, Math.round((h / this.s) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d")!;
    const r = (radius / this.s) * scale;
    ctx.beginPath();
    ctx.roundRect(0, 0, cw, ch, Math.min(r, cw / 2, ch / 2));
    ctx.clip();
    const cover = cs.objectFit === "cover";
    const ratio = cover ? Math.max(cw / bmp.width, ch / bmp.height) : Math.min(cw / bmp.width, ch / bmp.height);
    const dw = bmp.width * ratio;
    const dh = bmp.height * ratio;
    const [px = "50%", py = "50%"] = cs.objectPosition.split(/\s+/);
    const fx = px.endsWith("%") ? parseFloat(px) / 100 : 0.5;
    const fy = py.endsWith("%") ? parseFloat(py) / 100 : 0.5;
    ctx.drawImage(bmp, (cw - dw) * fx, (ch - dh) * fy, dw, dh);
    const jpeg = cover && r < 1;
    const data = jpeg ? canvas.toDataURL("image/jpeg", 0.92) : canvas.toDataURL("image/png");
    this.alpha(opacity, () => this.doc.addImage(data, jpeg ? "JPEG" : "PNG", x, y, w, h));
  }

  private async svg(el: SVGSVGElement, cs: CSSStyleDeclaration, x: number, y: number, w: number, h: number, opacity: number) {
    const color = parseColor(cs.color);
    if (!color) return;
    const clone = el.cloneNode(true) as SVGSVGElement;
    const rgb = `rgb(${color.r},${color.g},${color.b})`;
    clone.setAttribute("width", String(w / this.s));
    clone.setAttribute("height", String(h / this.s));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const markup = new XMLSerializer().serializeToString(clone).replaceAll("currentColor", rgb);
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    await image.decode().catch(() => undefined);
    if (!image.width) return;
    const scale = 6;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round((w / this.s) * scale);
    canvas.height = Math.round((h / this.s) * scale);
    canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
    this.alpha(color.a * opacity, () => this.doc.addImage(canvas.toDataURL("image/png"), "PNG", x, y, w, h));
  }
}
