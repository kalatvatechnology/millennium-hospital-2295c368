import fullLogoAsset from "@/assets/millennium-logo-full.png.asset.json";
import { hospitalName, type DigitalCardData } from "./data";
import { PDF_THEMES, type DigitalCardTheme } from "./themes";

type RGB = readonly [number, number, number];
type Shape = "circle" | "rounded" | "square" | "large";

/** Tall single-page portrait card (≈ 105 × 222 mm). */
const W = 298;
const H = 630;
const PAD = 22;

async function loadBitmap(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Image unavailable");
  return createImageBitmap(await res.blob());
}

/** Crop (cover, top-anchored) and mask the portrait on a canvas; text and links stay vector. */
async function shapedPhoto(url: string, w: number, h: number, shape: Shape) {
  const bmp = await loadBitmap(url);
  const scale = 4;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  if (shape === "circle") ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
  else ctx.roundRect(0, 0, canvas.width, canvas.height, shape === "rounded" ? 12 * scale : shape === "square" ? 2 * scale : 0);
  ctx.clip();
  const ratio = Math.max(canvas.width / bmp.width, canvas.height / bmp.height);
  const dw = bmp.width * ratio;
  const dh = bmp.height * ratio;
  ctx.drawImage(bmp, (canvas.width - dw) / 2, 0, dw, dh);
  return canvas.toDataURL("image/png");
}

async function logoData() {
  const bmp = await loadBitmap(fullLogoAsset.url);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function downloadDigitalCardPdf(card: DigitalCardData, themeKey: DigitalCardTheme) {
  const { jsPDF } = await import("jspdf");
  const t = PDF_THEMES[themeKey];
  const doc = new jsPDF({ unit: "pt", format: [W, H], orientation: "portrait", compress: true });
  doc.setProperties({ title: `${card.name} — Digital Card`, author: hospitalName, subject: "Digital Doctor Card" });

  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);

  fill(t.pageBg);
  doc.rect(0, 0, W, H, "F");

  const logo = await logoData().catch(() => null);
  const logoW = 116;
  const logoH = (logoW * 530) / 1837;
  const drawLogo = (x: number, y: number, plate: boolean) => {
    if (!logo) return;
    if (plate) {
      fill([255, 255, 255]);
      doc.roundedRect(x - 7, y - 5, logoW + 14, logoH + 10, 4, 4, "F");
    }
    doc.addImage(logo, "PNG", x, y, logoW, logoH);
  };

  const center = t.photo === "circle";
  let y = 0;
  let photoSize = 0;

  // Header + portrait
  if (t.header === "photo") {
    const ph = 236;
    if (card.photoUrl) {
      const img = await shapedPhoto(card.photoUrl, W, ph, "large").catch(() => null);
      if (img) doc.addImage(img, "PNG", 0, 0, W, ph);
      else { fill(t.headerBg); doc.rect(0, 0, W, ph, "F"); }
    } else { fill(t.headerBg); doc.rect(0, 0, W, ph, "F"); }
    drawLogo(PAD + 4, PAD, true);
    y = ph + 20;
  } else {
    const bandH = t.header === "band" ? 96 : t.header === "block" ? 84 : 0;
    if (bandH) {
      fill(t.headerBg);
      if (t.header === "block") doc.triangle(0, bandH, W, bandH - 14, W, bandH, "F");
      doc.rect(0, 0, W, t.header === "block" ? bandH - 14 : bandH, "F");
    }
    drawLogo(PAD + 6, PAD, t.header === "band" || t.header === "block" || t.logoOnDark);
    photoSize = t.photo === "rounded" ? 100 : t.photo === "square" ? 96 : 104;
    const photoH = t.photo === "rounded" ? 116 : photoSize;
    const px = center ? (W - photoSize) / 2 : PAD;
    const py = t.header === "band" ? 50 : t.header === "block" ? 62 : 70;
    if (t.header === "band") {
      fill([255, 255, 255]);
      doc.circle(W / 2, py + photoSize / 2, photoSize / 2 + 4, "F");
    }
    if (themeKey === "premium_medical") {
      stroke(t.accent);
      doc.setLineWidth(1.2);
      doc.circle(W / 2, py + photoSize / 2, photoSize / 2 + 6, "S");
    }
    if (t.photo === "square") {
      fill([255, 255, 255]);
      doc.rect(px - 4, py - 4, photoSize + 8, photoH + 8, "F");
    }
    const img = card.photoUrl ? await shapedPhoto(card.photoUrl, photoSize, photoH, t.photo).catch(() => null) : null;
    if (img) doc.addImage(img, "PNG", px, py, photoSize, photoH);
    else {
      fill(t.chipBg);
      if (t.photo === "circle") doc.circle(px + photoSize / 2, py + photoH / 2, photoSize / 2, "F");
      else doc.roundedRect(px, py, photoSize, photoH, 8, 8, "F");
    }
    y = py + photoH + 22;
  }

  const align = center ? "center" : "left";
  const tx = center ? W / 2 : PAD;
  const maxW = W - PAD * 2;
  const write = (text: string, size: number, style: "normal" | "bold", c: RGB, gap = 4) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    color(c);
    const lines = doc.splitTextToSize(text, maxW).slice(0, 2) as string[];
    doc.text(lines, tx, y, { align });
    y += lines.length * size * 1.18 + gap;
  };

  write(themeKey === "modern_executive" ? card.name.toUpperCase() : card.name, 19, "bold", themeKey === "premium_medical" || themeKey === "minimal_luxe" ? t.text : [46, 61, 118]);
  if (card.qualifications) write(card.qualifications, 9.5, "bold", t.muted, 6);
  fill(t.accent);
  doc.rect(center ? W / 2 - 14 : PAD, y - 2, 28, 2, "F");
  y += 12;
  if (card.designation) write(card.designation, 10, "normal", t.text, 2);
  if (card.specialization) write(card.specialization, 9.5, "normal", t.muted, 3);
  write(hospitalName.toUpperCase(), 7.5, "bold", t.accent, 12);

  // Services — chips, max 3 rows so the card never spills onto a second page.
  if (card.services.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    color(t.accent);
    doc.text("KEY SERVICES", PAD, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let x = PAD;
    let row = 0;
    const chipH = 16;
    for (const s of card.services) {
      const label = doc.splitTextToSize(s, maxW - 16)[0] as string;
      const cw = doc.getTextWidth(label) + 16;
      if (x + cw > W - PAD) { x = PAD; row += 1; if (row > 2) break; }
      const cy = y + row * (chipH + 5);
      fill(t.chipBg);
      if (t.chipBg === t.pageBg) { stroke([222, 226, 238]); doc.setLineWidth(0.7); doc.roundedRect(x, cy, cw, chipH, 4, 4, "FD"); }
      else doc.roundedRect(x, cy, cw, chipH, 8, 8, "F");
      color(t.chipText);
      doc.text(label, x + 8, cy + 11);
      x += cw + 5;
    }
    y += (row + 1) * (chipH + 5) + 10;
  }

  // Location
  if (card.location) {
    const lines: { text: string; bold?: boolean }[] = [{ text: card.location.name, bold: true }];
    if (card.location.address) lines.push({ text: card.location.address });
    card.location.hours.forEach((h) => lines.push({ text: h }));
    const boxH = 14 + lines.length * 12;
    fill(t.chipBg === t.pageBg ? [245, 246, 251] : t.chipBg);
    doc.roundedRect(PAD, y, maxW, boxH, 6, 6, "F");
    fill(t.accent);
    doc.rect(PAD, y + 6, 2, boxH - 12, "F");
    let ly = y + 14;
    lines.forEach((l) => {
      doc.setFont("helvetica", l.bold ? "bold" : "normal");
      doc.setFontSize(l.bold ? 9 : 8);
      color(l.bold ? (t.text) : t.muted);
      doc.text(doc.splitTextToSize(l.text, maxW - 20)[0] as string, PAD + 10, ly);
      ly += 12;
    });
    y += boxH + 14;
  }

  // Actions — every button is a real hyperlink annotation.
  const button = (x: number, by: number, w: number, h: number, text: string, url: string, primary: boolean) => {
    fill(primary ? t.primaryBtn : t.secondaryBtn);
    if (!primary && t.secondaryOutline) {
      stroke(t.secondaryText);
      doc.setLineWidth(0.7);
      doc.roundedRect(x, by, w, h, 5, 5, "FD");
    } else doc.roundedRect(x, by, w, h, 5, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    color(primary ? (themeKey === "minimal_luxe" ? [255, 255, 255] : [255, 255, 255]) : t.secondaryText);
    doc.text(text, x + w / 2, by + h / 2 + 3.2, { align: "center" });
    doc.link(x, by, w, h, { url });
  };

  const gap = 7;
  const half = (maxW - gap) / 2;
  const bh = 30;
  const actionsTop = Math.min(y, H - 150);
  y = actionsTop;
  button(PAD, y, half, bh, "Save Contact", card.actions.saveContact, true);
  button(PAD + half + gap, y, half, bh, "Book Appointment", card.actions.book, true);
  y += bh + gap;
  const sec = [
    card.actions.whatsapp && { t: "WhatsApp", u: card.actions.whatsapp },
    card.actions.call && { t: "Call", u: card.actions.call },
    card.actions.reviews && { t: "Google Reviews", u: card.actions.reviews },
  ].filter(Boolean) as { t: string; u: string }[];
  if (sec.length) {
    const sw = (maxW - gap * (sec.length - 1)) / sec.length;
    sec.forEach((s, i) => button(PAD + i * (sw + gap), y, sw, 26, s.t, s.u, false));
    y += 26 + 12;
  }
  const support = [
    card.actions.directions && { t: "Get Directions", u: card.actions.directions },
    { t: "View Full Profile", u: card.actions.profile },
  ].filter(Boolean) as { t: string; u: string }[];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const widths = support.map((s) => doc.getTextWidth(s.t));
  const total = widths.reduce((a, b) => a + b, 0) + (support.length - 1) * 22;
  let sx = (W - total) / 2;
  color(themeKey === "premium_medical" ? [255, 255, 255] : t.secondaryText);
  support.forEach((s, i) => {
    doc.textWithLink(s.t, sx, y + 6, { url: s.u });
    stroke(themeKey === "premium_medical" ? [255, 255, 255] : t.secondaryText);
    doc.setLineWidth(0.5);
    doc.line(sx, y + 8, sx + widths[i]!, y + 8);
    sx += widths[i]! + 22;
  });

  // Footer rule
  fill(t.accent);
  doc.rect(0, H - 5, W, 5, "F");

  doc.save(`${card.slug || "doctor"}-digital-card.pdf`);
}
