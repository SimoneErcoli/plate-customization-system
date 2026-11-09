import { PLATE_FONT_FAMILY, PLATE_HEIGHT, PLATE_WIDTH } from "@/components/PlateSvg";

const FONT_URL = "/fonts/BarlowCondensed-SemiBold.ttf";
let fontDataUrl: Promise<string> | null = null;

function loadFontDataUrl(): Promise<string> {
  fontDataUrl ??= fetch(FONT_URL)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }),
    );
  return fontDataUrl;
}

/** Serializza l'SVG incorporando il font, così l'immagine esportata è identica all'anteprima. */
async function serializeWithFont(svg: SVGSVGElement): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(PLATE_WIDTH));
  clone.setAttribute("height", String(PLATE_HEIGHT));
  clone.querySelectorAll("[data-export-hide]").forEach((el) => el.remove());
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `@font-face{font-family:${PLATE_FONT_FAMILY};src:url(${await loadFontDataUrl()}) format("truetype");}`;
  clone.insertBefore(style, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

export async function downloadPlateSvg(svg: SVGSVGElement, filename: string) {
  const blob = new Blob([await serializeWithFont(svg)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPlatePng(svg: SVGSVGElement, filename: string, scale = 4) {
  const markup = await serializeWithFont(svg);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = PLATE_WIDTH * scale;
  canvas.height = PLATE_HEIGHT * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponibile");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  triggerDownload(canvas.toDataURL("image/png"), filename);
}
